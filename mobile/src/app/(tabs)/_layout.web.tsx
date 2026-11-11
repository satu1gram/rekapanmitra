import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors } from '~/ui/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) => function TabIcon({ color, size }: { color: ColorValue; size: number }) {
  return <Ionicons name={name} color={color as string} size={size} />;
};

/** Web build only (used for browser previews and automated checks); iOS/Android use native tabs. */
export default function WebTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brand, tabBarInactiveTintColor: colors.textSubtle }}>
      <Tabs.Screen name="(beranda)" options={{ title: 'Beranda', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat', tabBarIcon: icon('receipt') }} />
      <Tabs.Screen name="stok" options={{ title: 'Stok', tabBarIcon: icon('cube') }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun', tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
