import React from 'react';

interface LoadingScreenProps {
    fullScreen?: boolean;
}

export function LoadingScreen({ fullScreen = false }: LoadingScreenProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center bg-card ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'
                }`}
        >
            <div className="max-w-md mx-auto flex flex-col items-center justify-center relative px-6 w-full">
                {/* Animated ring container */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-10">
                    {/* Soft pulsing background */}
                    <div className="absolute inset-0 bg-accent rounded-full animate-[pulse-soft_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                    {/* Glass inner circle */}
                    <div className="absolute inset-4 bg-card/80 rounded-full backdrop-blur-sm z-10" />
                    {/* Spinning ring */}
                    <div className="relative z-20 w-16 h-16 border-4 border-border border-t-primary rounded-full animate-[spin-slow_1.5s_linear_infinite]" />
                </div>

                {/* Text */}
                <div className="space-y-4 text-center z-10 max-w-[280px]">
                    <h1 className="text-2xl font-extrabold text-foreground leading-tight">
                        Mohon Tunggu Sebentar...
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">Sedang memproses data Anda</p>
                </div>

                {/* Screen reader */}
                <div className="sr-only" role="status">
                    Loading data, please wait.
                </div>
            </div>
        </div>
    );
}
