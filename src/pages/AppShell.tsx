import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/navigation/BottomNav';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

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
        </div>
    );
}

