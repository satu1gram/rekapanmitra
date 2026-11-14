import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGeneralExpenses, useGeneralIncome, useOrders, useProfile, useStock, useTargets } from '~/hooks/queries';
import { resetHomeReady, useHomeReady } from '~/lib/bootGate';
import { errorMessage } from '~/lib/supabase';
import { AuthProvider, useAuth } from '~/providers/AuthProvider';
import { ErrorPanel } from '~/ui/brand';
import { HomeHeaderSkeleton, HomeSkeleton } from '~/ui/skeleton';
import { colors } from '~/ui/theme';
import { DialogHost } from '~/ui/dialog';

SplashScreen.preventAutoHideAsync();

// Refetch when the app returns to the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', state => focusManager.setFocused(state === 'active'));
}
onlineManager.setOnline(true);

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, retryDelay: 1000 } } }),
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
          <DialogHost />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** First screen while the profile loads: the Beranda layout in grey, so the app opens into the shape it will have. */
function BootSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 14, paddingHorizontal: 16, gap: 20 }}>
      <HomeHeaderSkeleton />
      <HomeSkeleton />
    </View>
  );
}

/** Profile could not be loaded at start: same panel as Beranda's "Data belum bisa dimuat". */
function BootError({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 24, paddingHorizontal: 16 }}>
      <ErrorPanel message={message} onRetry={onRetry} retrying={retrying} />
    </View>
  );
}

function RootNavigator() {
  const { session, initializing } = useAuth();
  const profile = useProfile();
  const signedIn = !!session;
  // Beranda needs these five to draw. Loading them here, behind the same opening skeleton, means the app
  // opens straight into a filled Beranda instead of showing one skeleton, then Beranda's own skeleton.
  const core = [useOrders(), useStock(), useGeneralExpenses(), useGeneralIncome(), useTargets()];
  const coreSettled = core.every(q => !q.isPending);
  // On a very slow connection do not hold the opening screen forever: after a few seconds let Beranda load its own data.
  const userId = session?.user.id ?? null;
  const [waitedFor, setWaitedFor] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return undefined;
    const timer = setTimeout(() => setWaitedFor(userId), 6000);
    return () => clearTimeout(timer);
  }, [userId]);
  const waitedLongEnough = !!userId && waitedFor === userId;
  const onboarded = !!profile.data?.onboarding_completed;
  const profileReady = !signedIn || (profile.isSuccess && (!onboarded || coreSettled || waitedLongEnough));

  // The opening skeleton stays on top of the app until Beranda has drawn (or a short grace period passes, e.g. when the
  // app opens straight onto another tab), so there is no blank frame between skeleton and content.
  const homeReady = useHomeReady();
  const [graceOverFor, setGraceOverFor] = useState<string | null>(null);
  const covering = signedIn && profileReady && onboarded;
  useEffect(() => {
    if (!userId) resetHomeReady();
  }, [userId]);
  useEffect(() => {
    if (!covering || !userId) return undefined;
    const timer = setTimeout(() => setGraceOverFor(userId), 1500);
    return () => clearTimeout(timer);
  }, [covering, userId]);
  const showCover = covering && !homeReady && graceOverFor !== userId;

  // Leave the splash as soon as the session is known: the app then opens straight into its skeleton
  // (BootSkeleton while the profile loads) instead of staying on a still logo until the data arrives.
  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync();
  }, [initializing]);

  if (initializing) return null;
  if (signedIn && profile.isError) {
    return <BootError message={errorMessage(profile.error)} onRetry={() => profile.refetch()} retrying={profile.isRefetching} />;
  }
  if (!profileReady) return <BootSkeleton />;

  const needsOnboarding = signedIn && !profile.data?.onboarding_completed;

  return (
    <>
    <Stack screenOptions={{ headerTintColor: colors.brandDark, contentStyle: { backgroundColor: colors.bg }, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={!signedIn} redirectTo="/">
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={needsOnboarding} redirectTo="/">
        <Stack.Screen name="onboarding" options={{ title: 'Pengaturan awal', headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !needsOnboarding} redirectTo={signedIn ? '/onboarding' : '/welcome'}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="order/new" options={{ title: 'Tambah order', presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="order/[id]/index" options={{ title: 'Detail order', headerShown: false }} />
        <Stack.Screen name="order/[id]/edit" options={{ title: 'Ubah order', presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="restok/new" options={{ title: 'Catat restok', presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="restok/[id]" options={{ title: 'Ubah restok', presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="asisten" options={{ title: 'Isi dari chat', presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="keuangan/index" options={{ title: 'Pengeluaran & pemasukan', headerShown: false }} />
        <Stack.Screen name="keuangan/form" options={{ title: 'Catatan keuangan', presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="target" options={{ title: 'Target bulanan', headerShown: false }} />
        <Stack.Screen name="pelanggan/index" options={{ title: 'Pelanggan', headerShown: false }} />
        <Stack.Screen name="pelanggan/[id]" options={{ title: 'Pelanggan', headerShown: false }} />
        <Stack.Screen name="toko" options={{ title: 'Toko online', headerShown: false }} />
        <Stack.Screen name="hapus-akun" options={{ title: 'Hapus akun', headerShown: false }} />
      </Stack.Protected>
    </Stack>
    {showCover ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="auto"><BootSkeleton /></View> : null}
    </>
  );
}
