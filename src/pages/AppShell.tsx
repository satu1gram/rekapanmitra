import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/navigation/BottomNav';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function AppShell() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingScreen fullScreen />;
    }

    // Redirect ke login jika belum auth, simpan halaman tujuan
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
        </div>
    );
}
