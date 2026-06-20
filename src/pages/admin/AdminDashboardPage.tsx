import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, Package, Activity, AlertTriangle, TrendingUp, Search, Clock, ShieldCheck, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/formatters";

export default function AdminDashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-global-metrics'],
    queryFn: async () => {
      const { count: totalMitra } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'mitra');

      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_price, buy_price, status, created_at, user_id')
        .order('created_at', { ascending: false });
      
      const totalRevenue = orders?.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0) || 0;
      const completedOrders = orders?.filter(o => o.status === 'selesai').length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

      const { data: anomaliStock } = await supabase
        .from('user_stock')
        .select('user_id, current_stock')
        .lt('current_stock', 0);

      let enrichedAnomali = [];
      if (anomaliStock && anomaliStock.length > 0) {
        const userIds = anomaliStock.map(a => a.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, location')
          .in('user_id', userIds);
          
        enrichedAnomali = anomaliStock.map(stock => {
          const profile = profiles?.find(p => p.user_id === stock.user_id);
          return {
            ...stock,
            profiles: profile || null
          };
        });
      }

      // Process recent orders for activity feed
      const recentOrdersList = orders ? orders.slice(0, 5) : [];
      let enrichedRecentOrders = [];
      if (recentOrdersList.length > 0) {
        const userIds = recentOrdersList.map(o => o.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);
          
        enrichedRecentOrders = recentOrdersList.map(order => {
          const profile = profiles?.find(p => p.user_id === order.user_id);
          return {
            ...order,
            profiles: profile || null
          };
        });
      }

      // Fetch latest registered mitras
      const { data: latestMitras } = await supabase
        .from('profiles')
        .select('id, name, location, created_at, role')
        .eq('role', 'mitra')
        .order('created_at', { ascending: false })
        .limit(3);

      return {
        totalMitra: totalMitra || 0,
        totalRevenue,
        completedOrders,
        pendingOrders,
        anomaliStock: enrichedAnomali,
        recentOrders: enrichedRecentOrders,
        latestMitras: latestMitras || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-1/3 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-200/60 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-64 bg-slate-200/60 rounded-2xl" />
          <div className="lg:col-span-1 h-64 bg-slate-200/60 rounded-2xl" />
          <div className="lg:col-span-1 h-64 bg-slate-200/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">System Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time business state and operational metrics</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Activity className="text-emerald-500 animate-pulse" size={16} />
          <span className="text-sm font-bold text-slate-700">Live Connection</span>
        </div>
      </header>

      {/* Top Row: Key Metrics - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-slate-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="bg-slate-100 w-10 h-10 rounded-xl flex items-center justify-center">
              <Users className="text-slate-700" size={20} />
            </div>
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Mitra Aktif</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-48 bg-slate-800 text-white text-[10px] font-medium p-2">
                    Jumlah orang/toko yang saat ini mendaftar dan menggunakan aplikasi RekapanMitra.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-slate-900 leading-none">{metrics?.totalMitra}</p>
                <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mb-0.5">
                  <TrendingUp size={10} className="mr-1" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2 - Highlighted */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg shadow-slate-900/20 hover:shadow-xl transition-shadow group relative overflow-hidden">
          <div className="absolute -right-12 -top-12 bg-indigo-500/20 w-40 h-40 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-colors duration-500" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="bg-slate-800 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-700">
              <DollarSign className="text-emerald-400" size={20} />
            </div>
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Total GMV Sistem</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-48 bg-white text-slate-800 text-[10px] font-medium p-2 border border-slate-100">
                    Total uang yang berputar (nilai transaksi kotor) dari seluruh penjualan semua mitra di sistem ini.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-black text-white leading-none">{formatCurrency(metrics?.totalRevenue || 0)}</p>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-slate-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="bg-amber-100 w-10 h-10 rounded-xl flex items-center justify-center">
              <Package className="text-amber-600" size={20} />
            </div>
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Pending Orders</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-48 bg-slate-800 text-white text-[10px] font-medium p-2">
                    Pesanan dari pembeli yang belum diselesaikan atau belum dikirim oleh mitra.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-slate-900 leading-none">{metrics?.pendingOrders}</p>
                <span className="text-[10px] font-bold text-slate-400 mb-0.5">{metrics?.completedOrders} selesai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-slate-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="bg-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center">
              <Activity className="text-indigo-600" size={20} />
            </div>
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Aktivitas Terakhir</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-48 bg-slate-800 text-white text-[10px] font-medium p-2">
                    Jam berapakah terakhir kali sistem menerima transaksi baru dari mitra manapun.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-lg font-black flex items-center gap-2 text-slate-900 mt-1 leading-none">
                {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {new Date(metrics.recentOrders[0].created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </>
                ) : (
                  <span className="text-sm text-slate-400">Belum ada aktivitas</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Anomalies, New Mitras & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column (1/3 width): Anomalies & Mitra Baru */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          {/* Anomaly Detection */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-64">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-red-50/50 shrink-0 rounded-t-2xl">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="text-red-600" size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-slate-900 text-sm leading-none">System Anomalies</h2>
                  <div className="relative group/tooltip">
                    <Info size={14} className="text-slate-300 cursor-help" />
                    <div className="absolute left-0 top-full mt-2 hidden group-hover/tooltip:block w-48 p-2 bg-slate-800 text-white text-[10px] font-medium rounded-lg shadow-xl z-50">
                      Alarm otomatis jika ada mitra yang stok barangnya tembus minus.
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-red-600/70 mt-0.5">Stok Negatif Terdeteksi</p>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50/30 rounded-b-2xl">
              {metrics?.anomaliStock && metrics.anomaliStock.length > 0 ? (
                <div className="space-y-2">
                  {metrics.anomaliStock.map((anomali, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-red-100 flex items-start justify-between gap-3 group hover:border-red-300 transition-colors">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{(anomali.profiles as any)?.name || 'Unknown User'}</p>
                        <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{(anomali.profiles as any)?.location}</p>
                      </div>
                      <div className="bg-red-50 text-red-700 px-2 py-1 rounded-lg text-[10px] font-black whitespace-nowrap border border-red-100">
                        Stok: {anomali.current_stock}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-60">
                  <ShieldCheck size={32} className="text-emerald-500 mb-2" />
                  <p className="font-bold text-sm text-slate-700">Semua Terkendali</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-1">Tidak ada anomali stok.</p>
                </div>
              )}
            </div>
          </div>

          {/* New Mitras */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[320px]">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-indigo-50/50 shrink-0 rounded-t-2xl">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Users className="text-indigo-600" size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-slate-900 text-sm leading-none">Mitra Baru</h2>
                  <div className="relative group/tooltip">
                    <Info size={14} className="text-slate-300 cursor-help" />
                    <div className="absolute right-0 top-full mt-2 hidden group-hover/tooltip:block w-48 p-2 bg-slate-800 text-white text-[10px] font-medium rounded-lg shadow-xl z-50">
                      Daftar mitra yang paling baru mendaftar di sistem.
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-indigo-600/70 mt-0.5">Registrasi Terakhir</p>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50/30 rounded-b-2xl">
              {metrics?.latestMitras && metrics.latestMitras.length > 0 ? (
                <div className="space-y-2">
                  {metrics.latestMitras.map((mitra, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between gap-3 group hover:border-indigo-100 transition-colors">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{mitra.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{mitra.location || 'Unknown Area'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-700">
                          {new Date(mitra.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                          {new Date(mitra.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                  Belum ada mitra baru
                </div>
              )}
              
              <button className="mt-3 w-full py-2 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shrink-0">
                Lihat Semua Mitra
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (2/3 width): Activity Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 rounded-t-2xl">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-900 text-sm leading-none">Recent Transactions</h2>
                <div className="relative group/tooltip">
                  <Info size={14} className="text-slate-300 cursor-help" />
                  <div className="absolute left-0 top-full mt-2 hidden group-hover/tooltip:block w-48 p-2 bg-slate-800 text-white text-[10px] font-medium rounded-lg shadow-xl z-50">
                    Daftar pesanan terbaru dari jaringan.
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">Transaksi terakhir</p>
            </div>
            <button className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors border border-slate-200">
              <Search size={14} />
            </button>
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto bg-slate-50/30 rounded-b-2xl">
            {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
              metrics.recentOrders.map((order, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all group">
                  <div className="bg-emerald-100 p-2.5 rounded-xl shrink-0 h-fit">
                    <DollarSign className="text-emerald-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{(order.profiles as any)?.name || 'Unknown User'}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 shrink-0">
                        <Clock size={12} />
                        {new Date(order.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-black text-slate-700">{formatCurrency(order.total_price)}</p>
                        {order.buy_price != null && (
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5">Modal: {formatCurrency(order.buy_price)}</p>
                        )}
                      </div>
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded uppercase tracking-wider border border-emerald-100">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                Belum ada transaksi
              </div>
            )}
            
            <button className="mt-1 w-full py-2 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shrink-0">
              View All Transactions
            </button>
          </div>
        </div>

      </div>
    </div>
    </TooltipProvider>
  );
}
