import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AppShell } from "./pages/AppShell";
import { AuthPage } from "@/components/auth/AuthPage";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

// Lazy-load each page → hemat data (code-splitting otomatis via Vite)
const LandingPage = lazy(() => import("./pages/LandingPage"));
const KatalogProdukPage = lazy(() => import("./pages/KatalogProdukPage"));
const AIHealthAdvisorPage = lazy(() => import("./pages/AIHealthAdvisorPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const RiwayatPage = lazy(() => import("./pages/RiwayatPage"));
const ProdukPage = lazy(() => import("./pages/ProdukPage"));
const AkunPage = lazy(() => import("./pages/AkunPage"));
const PublicOrderPage = lazy(() => import("./pages/PublicOrderPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache 5 menit — kurangi request berulang dan hemat data
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function PageLoader({ variant }: { variant?: 'default' | 'katalog' | 'dashboard' | 'list' }) {
  return <LoadingScreen variant={variant} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProfileProvider>
      <TooltipProvider>
        <Toaster />
        <PWAUpdatePrompt />
        <Sonner
          position="top-center"
          duration={4000}
          richColors
          expand
          toastOptions={{
            className: "w-full sm:max-w-md", // Ensure it fits mobile and desktop nicely
            classNames: {
              toast: "group toast px-5 py-4 rounded-[1.5rem] shadow-2xl border-2 flex items-center gap-4 bg-white/95 backdrop-blur-md transition-all active:scale-95",
              success: "text-emerald-700 border-emerald-100",
              error: "text-red-700 border-red-100",
              warning: "text-amber-700 border-amber-100",
              info: "text-slate-800 border-slate-100",
              title: "font-black text-[15px] tracking-tight leading-none",
              description: "font-bold text-[13px] opacity-70",
              actionButton: "bg-emerald-600 text-white font-black rounded-xl px-4 py-2 text-xs",
              cancelButton: "bg-slate-100 text-slate-500 font-bold rounded-xl px-4 py-2 text-xs",
            },
          }}
        />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Landing page utama — visitor / organic user */}
            <Route path="/" element={
              <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>
            } />

            {/* Katalog public page */}
            <Route path="/katalog" element={
              <Suspense fallback={<PageLoader variant="katalog" />}><KatalogProdukPage /></Suspense>
            } />

            {/* AI Health Advisor page */}
            <Route path="/ai-advisor" element={
              <Suspense fallback={<PageLoader variant="katalog" />}><AIHealthAdvisorPage /></Suspense>
            } />

            {/* Auth route — tidak perlu shell */}
            <Route path="/login" element={<AuthPage />} />

            {/* Public store page — no auth required */}
            <Route path="/toko/:slug" element={
              <Suspense fallback={<PageLoader />}><PublicOrderPage /></Suspense>
            } />

            {/* Reset password — link dari email Supabase */}
            <Route path="/reset-password" element={
              <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>
            } />

            {/* App routes — semua di dalam AppShell */}
            <Route element={<AppShell />}>
              <Route path="dashboard" element={
                <Suspense fallback={<PageLoader variant="dashboard" />}><DashboardPage /></Suspense>
              } />
              <Route path="riwayat" element={
                <Suspense fallback={<PageLoader variant="list" />}><RiwayatPage /></Suspense>
              } />
              <Route path="produk" element={
                <Suspense fallback={<PageLoader />}><ProdukPage /></Suspense>
              } />
              <Route path="akun" element={
                <Suspense fallback={<PageLoader />}><AkunPage /></Suspense>
              } />
            </Route>

            {/* Redirect unknown routes ke home */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
