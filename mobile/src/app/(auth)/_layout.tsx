import { Stack } from 'expo-router';
import { colors } from '~/ui/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" options={{ title: 'Daftar akun' }} />
      <Stack.Screen name="verify" options={{ title: 'Verifikasi email' }} />
      <Stack.Screen name="forgot" options={{ title: 'Lupa kata sandi' }} />
    </Stack>
  );
}
