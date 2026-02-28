import React from 'react';

interface LoadingScreenProps {
    /** Jika true, screen mengisi seluruh viewport */
    fullScreen?: boolean;
    /** Teks judul utama */
    title?: string;
    /** Subteks deskripsi */
    subtitle?: string;
}

export function LoadingScreen({
    fullScreen = false,
    title = 'Mohon Tunggu Sebentar...',
    subtitle = 'Sedang memproses data Anda',
}: LoadingScreenProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center bg-white ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'
                }`}
        >
            <div className="max-w-md mx-auto flex flex-col items-center justify-center relative px-6 w-full">

                {/* Animated ring container */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-10">

                    {/* Outer pulsing emerald circle */}
                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse-soft" />

                    {/* Inner frosted glass circle */}
                    <div className="absolute inset-4 bg-white/80 rounded-full backdrop-blur-sm z-10" />

                    {/* Spinning arc ring — matches gambar: hijau gelap di bagian atas */}
                    <div className="relative z-20 w-16 h-16 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin-slow" />
                </div>

                {/* Text */}
                <div className="space-y-3 text-center z-10 max-w-[280px]">
                    <h1 className="text-2xl font-extrabold text-slate-800 leading-tight">
                        {title}
                    </h1>
                    <p className="text-slate-500 text-base font-medium">
                        {subtitle}
                    </p>
                </div>

                {/* Accessibility */}
                <div className="sr-only" role="status" aria-live="polite">
                    Loading data, please wait.
                </div>
            </div>
        </div>
    );
}
