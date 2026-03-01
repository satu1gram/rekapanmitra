import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/navigation/BottomNav';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useState } from 'react';
import { Plus, X, Package, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

function GlobalFAB() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleTambahOrder = () => {
        setOpen(false);
        navigate('/riwayat', { state: { openAdd: true } });
    };

    const handleRestok = () => {
        setOpen(false);
        navigate('/produk');
    };

    return (
        <>
            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* FAB menu items */}
            <div className={cn(
                'fixed z-50 flex flex-col items-end gap-3 transition-all duration-300 right-4',
                open ? 'bottom-[9.5rem] opacity-100 pointer-events-auto' : 'bottom-[9.5rem] opacity-0 pointer-events-none'
            )}>
                <button
                    onClick={handleRestok}
                    className="flex items-center gap-3 bg-slate-800 text-white pl-4 pr-5 py-3 rounded-full shadow-xl active:scale-95 transition-all"
                >
                    <Package className="h-5 w-5" />
                    <span className="font-bold text-sm">Restok</span>
                </button>
                <button
                    onClick={handleTambahOrder}
                    className="flex items-center gap-3 bg-emerald-600 text-white pl-4 pr-5 py-3 rounded-full shadow-xl shadow-emerald-200 active:scale-95 transition-all"
                >
                    <ShoppingCart className="h-5 w-5" />
                    <span className="font-bold text-sm">Tambah Order</span>
                </button>
            </div>

            {/* Main FAB button */}
            <button
                onClick={() => setOpen(v => !v)}
                className={cn(
                    'fixed right-5 bottom-[5.5rem] z-50 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95',
                    open
                        ? 'bg-slate-700 rotate-45 shadow-slate-300'
                        : 'bg-emerald-600 shadow-emerald-300'
                )}
                style={{ boxShadow: open ? '0 8px 30px rgba(0,0,0,0.25)' : '0 8px 30px rgba(5,150,105,0.45)' }}
            >
                {open
                    ? <X className="h-5 w-5 text-white" />
                    : <Plus className="h-5 w-5 text-white" />
                }
            </button>
        </>
    );
}

export function AppShell() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingScreen fullScreen />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-lg mx-auto min-h-screen flex flex-col relative pb-[5.5rem]">
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
            <BottomNav />
            <GlobalFAB />
        </div>
    );
}
