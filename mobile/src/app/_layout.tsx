import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useProfile } from '~/hooks/queries';
import { errorMessage } from '~/lib/supabase';
import { AuthProvider, useAuth } from '~/providers/AuthProvider';
import { ErrorState, LoadingState } from '~/ui/components';
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

function RootNavigator() {
  const { session, initializing } = useAuth();
  const profile = useProfile();
  const signedIn = !!session;
  const profileReady = !signedIn || profile.isSuccess;

  useEffect(() => {
    if (!initializing && (profileReady || profile.isError)) SplashScreen.hideAsync();
  }, [initializing, profileReady, profile.isError]);

  if (initializing) return null;
  if (signedIn && profile.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ErrorState message={errorMessage(profile.error)} onRetry={() => profile.refetch()} />
      </View>
    );
  }
  if (!profileReady) return <View style={{ flex: 1, backgroundColor: colors.bg }}><LoadingState /></View>;

  const needsOnboarding = signedIn && !profile.data?.onboarding_completed;

  return (
    <Stack screenOptions={{ headerTintColor: colors.brandDark, contentStyle: { backgroundColor: colors.bg }, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={!signedIn} redirectTo="/">
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={needsOnboarding} redirectTo="/">
        <Stack.Screen name="onboarding" options={{ title: 'Pengaturan awal', headerBackVisible: false, gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !needsOnboarding} redirectTo={signedIn ? '/onboarding' : '/login'}>
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
  );
}
