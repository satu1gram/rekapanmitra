import { Stack } from 'expo-router';
import { colors } from '~/ui/theme';

export default function RiwayatLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: colors.brandDark, headerLargeTitle: true, headerShadowVisible: false, headerStyle: { backgroundColor: colors.bg }, contentStyle: { backgroundColor: colors.bg }, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Riwayat', headerShown: false }} />
    </Stack>
  );
}
