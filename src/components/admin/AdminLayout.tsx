import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useProfileContext } from '@/contexts/ProfileContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ShieldCheck, LayoutDashboard, Users, LogOut, Menu, X, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const AdminLayout = () => {
  const { profile, loading } = useProfileContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (loading) {
    return <LoadingScreen variant="default" />;
  }

  // Jika belum login atau role bukan admin, tampilkan layar error diagnostik
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-lg w-full backdrop-blur-md">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2 text-red-400">Akses Ditolak</h1>
          <p className="text-slate-400 mb-6 font-medium">Sistem membaca data profilmu tidak valid untuk rute ini.</p>
          
          <div className="bg-slate-950 p-6 rounded-2xl text-left font-mono text-sm overflow-auto border border-slate-800">
            <p className="text-emerald-400 mb-2">/* DIAGNOSTIK DATA AKTUAL */</p>
            <p><span className="text-slate-500">Status Login:</span> {profile ? '✅ Ada' : '❌ Kosong (Null)'}</p>
            <p><span className="text-slate-500">Nama Akun :</span> <span className="text-amber-300">{profile?.name || 'Tidak ada'}</span></p>
            <p><span className="text-slate-500">Role Sistem:</span> <span className="text-red-400 font-bold px-2 py-0.5 bg-red-500/20 rounded">{profile?.role || 'UNDEFINED'}</span></p>
          </div>

          <a href="/dashboard" className="mt-8 inline-flex items-center gap-2 bg-white text-slate-900 font-black px-6 py-3 rounded-xl hover:scale-105 transition-transform">
            <ArrowLeft size={18} />
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Mitra List', path: '/admin/mitra', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans flex text-slate-900">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        onClick={() => isCollapsed && setIsCollapsed(false)}
        className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col group",
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "lg:w-20 cursor-pointer" : "lg:w-72"
      )}>
        <div className={cn("p-6 flex items-center justify-between border-b border-slate-100", isCollapsed && "lg:px-4 lg:justify-center")}>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-md shrink-0">
              <ShieldCheck size={24} className="text-emerald-400" />
            </div>
            <div className={cn("transition-opacity duration-300", isCollapsed && "lg:hidden")}>
              <h2 className="font-black text-lg tracking-tight leading-none text-slate-900 whitespace-nowrap">Super Admin</h2>
              <p className="text-xs font-bold text-slate-400 mt-1 whitespace-nowrap">Control Center</p>
            </div>
          </div>
          {!isCollapsed && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCollapsed(true); setIsMobileMenuOpen(false); }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg hidden lg:block"
            >
              <X size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
          <p className={cn("text-xs font-black text-slate-400 uppercase tracking-wider mb-2 px-3 whitespace-nowrap", isCollapsed && "lg:text-center lg:px-0 lg:text-[10px]")}>
            {isCollapsed ? "Menu" : "Menu Utama"}
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 relative",
                isActive 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                isCollapsed && "lg:justify-center lg:px-0"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon size={18} className={cn("transition-colors shrink-0")} />
              <span className={cn("relative z-10 whitespace-nowrap transition-opacity duration-300", isCollapsed && "lg:hidden")}>{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className={cn("p-4 border-t border-slate-100 bg-slate-50/50", isCollapsed && "lg:p-3")}>
          <div className={cn("flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm mb-4", isCollapsed && "lg:px-2 lg:justify-center")}>
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm uppercase shrink-0">
              {profile.name?.substring(0, 2) || 'AD'}
            </div>
            <div className={cn("flex-1 min-w-0 transition-opacity duration-300", isCollapsed && "lg:hidden")}>
              <p className="font-bold text-sm text-slate-900 truncate">{profile.name}</p>
              <p className="text-xs font-medium text-slate-500 truncate">Administrator</p>
            </div>
          </div>
          <a 
            href="/dashboard" 
            title={isCollapsed ? "Keluar" : undefined}
            onClick={(e) => e.stopPropagation()}
            className={cn("flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors", isCollapsed && "lg:px-0")}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={cn("whitespace-nowrap transition-opacity duration-300", isCollapsed && "lg:hidden")}>Keluar Mode Admin</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <ShieldCheck size={18} className="text-emerald-400" />
            </div>
            <span className="font-black text-slate-900">Super Admin</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
