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
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const RiwayatPage = lazy(() => import("./pages/RiwayatPage"));
const ProdukPage = lazy(() => import("./pages/ProdukPage"));
const AkunPage = lazy(() => import("./pages/AkunPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache 5 menit — kurangi request berulang dan hemat data
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return <LoadingScreen />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Auth route — tidak perlu shell */}
            <Route path="/login" element={<AuthPage />} />

            {/* App routes — semua di dalam AppShell */}
            <Route element={<AppShell />}>
              <Route index element={
                <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>
              } />
              <Route path="riwayat" element={
                <Suspense fallback={<PageLoader />}><RiwayatPage /></Suspense>
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
