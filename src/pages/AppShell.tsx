import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/navigation/BottomNav';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export function AppShell() {
    const { user, loading } = useAuth();
    const location = useLocation();
    const { isOnboardingComplete, isOnboardingLoading } = useOnboarding();
    const queryClient = useQueryClient();

    const handleRefresh = async () => {
        await queryClient.invalidateQueries();
    };

    const { pullY, isRefreshing, PULL_THRESHOLD, PULL_MAX } = usePullToRefresh(handleRefresh);

    // Block rendering while loading auth OR onboarding status
    if (loading || isOnboardingLoading) {
        return <LoadingScreen fullScreen />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const pullProgress = Math.min(pullY / PULL_THRESHOLD, 1);
    const showIndicator = pullY > 0 || isRefreshing;

    return (
        <div className="min-h-screen bg-background">
            {/* Pull-to-refresh indicator */}
            {showIndicator && (
                <div
                    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
                    style={{ height: isRefreshing ? 56 : Math.min(pullY * 0.6, PULL_MAX * 0.6) }}
                >
                    <div
                        className="flex items-center justify-center rounded-full bg-white shadow-md border border-emerald-100"
                        style={{
                            width: 36,
                            height: 36,
                            opacity: isRefreshing ? 1 : pullProgress,
                            transform: `scale(${0.6 + pullProgress * 0.4})`,
                        }}
                    >
                        <svg
                            className={isRefreshing ? 'animate-spin' : ''}
                            style={{
                                transform: isRefreshing ? undefined : `rotate(${pullProgress * 360}deg)`,
                            }}
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                                stroke="#059669"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>
            )}

            {/* Onboarding wizard — muncul di atas semua konten jika belum selesai */}
            {isOnboardingComplete === false && <OnboardingWizard />}

            <div
                className="max-w-lg mx-auto min-h-screen flex flex-col relative pb-[5.5rem]"
                style={{
                    transform: pullY > 0 ? `translateY(${Math.min(pullY * 0.4, PULL_MAX * 0.4)}px)` : undefined,
                    transition: pullY === 0 ? 'transform 0.2s ease' : undefined,
                }}
            >
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
            <BottomNav />
        </div>
    );
}

