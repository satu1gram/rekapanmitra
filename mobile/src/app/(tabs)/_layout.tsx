import type { ReactNode } from 'react';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { AccountTabIcon, HistoryTabIcon, HomeTabIcon, StockTabIcon, type IconProps } from '~/ui/icons';
import { colors } from '~/ui/theme';

type TabIcon = (p: IconProps & { active: boolean }) => ReactNode;
const icon = (Icon: TabIcon) =>
  function TabBarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon color={color as string} active={focused} size={26} />;
  };

/**
 * Bottom navigation drawn like the design (Super app · Beranda): white bar, hairline top border,
 * the design's own icons (filled when active), brand green when active and #6C6C70 otherwise (5.2:1).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="(beranda)" options={{ title: 'Beranda', tabBarIcon: icon(HomeTabIcon) }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat', tabBarIcon: icon(HistoryTabIcon) }} />
      <Tabs.Screen name="stok" options={{ title: 'Stok', tabBarIcon: icon(StockTabIcon) }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun', tabBarIcon: icon(AccountTabIcon) }} />
    </Tabs>
  );
}
