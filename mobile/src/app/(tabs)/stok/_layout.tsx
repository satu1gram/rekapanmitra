import { Stack } from 'expo-router';
import { colors } from '~/ui/theme';

/** One screen per tab, no header and no entering animation, so the tab's content shows the moment the tab does. */
export default function StokLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" options={{ title: 'Stok' }} />
    </Stack>
  );
}
