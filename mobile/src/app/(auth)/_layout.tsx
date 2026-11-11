import { Stack } from 'expo-router';
import { colors } from '~/ui/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: colors.brandDark, contentStyle: { backgroundColor: colors.bg }, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Daftar akun' }} />
      <Stack.Screen name="forgot" options={{ title: 'Lupa kata sandi' }} />
    </Stack>
  );
}
