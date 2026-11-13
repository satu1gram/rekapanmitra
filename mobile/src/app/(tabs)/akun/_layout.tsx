import { Stack } from 'expo-router';
import { colors } from '~/ui/theme';

export default function AkunLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" options={{ title: 'Akun' }} />
    </Stack>
  );
}
