import { Stack } from 'expo-router';
import { colors } from '~/ui/theme';

export default function StokLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" options={{ title: 'Stok' }} />
    </Stack>
  );
}
