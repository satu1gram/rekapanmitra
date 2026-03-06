import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/navigation/BottomNav';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useState } from 'react';
import { Plus, X, Package, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';


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
                    className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
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
                    className="flex items-center gap-3 bg-secondary text-secondary-foreground pl-4 pr-5 py-3 rounded-full shadow-xl active:scale-95 transition-all"
                >
                    <Package className="h-5 w-5" />
                    <span className="font-bold text-sm">Restok</span>
                </button>
                <button
                    onClick={handleTambahOrder}
                    className="flex items-center gap-3 bg-primary text-primary-foreground pl-4 pr-5 py-3 rounded-full shadow-xl active:scale-95 transition-all"
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
                        ? 'bg-secondary rotate-45'
                        : 'bg-primary'
                )}
            >
                {open
                    ? <X className="h-5 w-5 text-secondary-foreground" />
                    : <Plus className="h-5 w-5 text-primary-foreground" />
                }
            </button>
        </>
    );
}

export function AppShell() {
    const { user, loading } = useAuth();
    const location = useLocation();
    const { isOnboardingComplete, isOnboardingLoading } = useOnboarding();

    if (loading || isOnboardingLoading) {
        return <LoadingScreen fullScreen />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Onboarding wizard — muncul di atas semua konten jika belum selesai */}
            {isOnboardingComplete === false && <OnboardingWizard />}

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

