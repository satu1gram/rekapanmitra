import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingScreenProps {
    fullScreen?: boolean;
    variant?: 'default' | 'katalog' | 'dashboard' | 'list';
}

/** Generic skeleton-based loading screen */
export function LoadingScreen({ fullScreen = false, variant = 'default' }: LoadingScreenProps) {
    const content = (() => {
        switch (variant) {
            case 'katalog':
                return <KatalogSkeleton />;
            case 'dashboard':
                return <DashboardSkeleton />;
            case 'list':
                return <ListSkeleton />;
            default:
                return <DefaultSkeleton />;
        }
    })();

    return (
        <div className={`bg-background ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'}`}>
            {content}
            <div className="sr-only" role="status">Loading data, please wait.</div>
        </div>
    );
}

/* ── Default: card-like skeleton ── */
function DefaultSkeleton() {
    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto pt-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
            </div>
            {/* Cards */}
            {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            ))}
        </div>
    );
}

/* ── Katalog: mimics the katalog page structure ── */
function KatalogSkeleton() {
    return (
        <div className="animate-in fade-in duration-300">
            {/* Nav skeleton */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <Skeleton className="h-8 w-32 rounded-lg" />
                <div className="flex gap-3">
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>

            {/* Hero AI section */}
            <div className="px-5 py-8 space-y-5 max-w-3xl mx-auto">
                <Skeleton className="h-7 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-4 w-72" />

                {/* Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {[80, 96, 72, 88, 104, 80, 96, 72].map((w, i) => (
                        <Skeleton key={i} className="h-9 rounded-full" style={{ width: w }} />
                    ))}
                </div>

                {/* Textarea */}
                <Skeleton className="h-24 w-full rounded-2xl" />

                {/* Button */}
                <Skeleton className="h-14 w-full rounded-2xl" />
            </div>

            {/* Trust bar */}
            <div className="flex items-center justify-center gap-4 py-4 border-y border-border/30">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-4 w-28 rounded" />
                ))}
            </div>

            {/* Product cards section */}
            <div className="px-5 py-8 max-w-5xl mx-auto space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-7 w-48" />
                </div>

                {/* Category tabs */}
                <div className="flex gap-2">
                    {[64, 96, 88, 72, 64].map((w, i) => (
                        <Skeleton key={i} className="h-9 rounded-full" style={{ width: w }} />
                    ))}
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="rounded-2xl border border-border/40 overflow-hidden">
                            <Skeleton className="h-48 w-full rounded-none" />
                            <div className="p-4 space-y-3">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <div className="flex gap-2 pt-1">
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-9 w-28 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── Dashboard: cards + chart ── */
function DashboardSkeleton() {
    return (
        <div className="p-4 space-y-4 max-w-lg mx-auto pt-2 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-7 w-40" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            {/* Summary cards row */}
            <div className="grid grid-cols-2 gap-3">
                {[1, 2].map(i => (
                    <div key={i} className="rounded-2xl border border-border/50 p-4 space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </div>

            {/* Large card */}
            <div className="rounded-2xl border border-border/50 p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>

            {/* List items */}
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/50 p-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                </div>
            ))}
        </div>
    );
}

/* ── List: order/riwayat-style ── */
function ListSkeleton() {
    return (
        <div className="p-4 space-y-4 max-w-lg mx-auto pt-2 animate-in fade-in duration-300">
            {/* Header + tabs */}
            <div className="space-y-3">
                <Skeleton className="h-6 w-28" />
                <div className="flex gap-2">
                    {[64, 80, 72].map((w, i) => (
                        <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
                    ))}
                </div>
            </div>

            {/* List items */}
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="rounded-2xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                </div>
            ))}
        </div>
    );
}
