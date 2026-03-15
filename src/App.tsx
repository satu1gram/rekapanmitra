import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "./pages/AppShell";
import { AuthPage } from "@/components/auth/AuthPage";
import NotFound from "./pages/NotFound";
import { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

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
      <TooltipProvider>
        <Toaster />
        <Sonner
          position="top-center"
          duration={4000}
          richColors
          expand
          toastOptions={{
            classNames: {
              error: 'bg-red-600 text-white border-red-700 shadow-2xl shadow-red-300 font-bold text-sm',
              success: 'bg-emerald-600 text-white border-emerald-700 font-bold text-sm',
              warning: 'bg-amber-500 text-white border-amber-600 font-bold text-sm',
              info: 'bg-slate-800 text-white border-slate-700 font-bold text-sm',
              title: 'font-extrabold text-base',
              description: 'font-medium opacity-90',
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
