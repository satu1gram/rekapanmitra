import { Stack } from 'expo-router';
import { colors } from '~/ui/theme';

export default function StokLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: colors.brandDark, headerLargeTitle: true, headerShadowVisible: false, headerStyle: { backgroundColor: colors.bg }, contentStyle: { backgroundColor: colors.bg }, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Stok' }} />
    </Stack>
  );
}
