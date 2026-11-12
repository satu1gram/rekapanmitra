import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountTabIcon, HistoryTabIcon, HomeTabIcon, StockTabIcon, type IconProps } from '~/ui/icons';
import { colors } from '~/ui/theme';

type TabIcon = (p: IconProps & { active: boolean }) => ReactNode;
const TABS: Record<string, { title: string; Icon: TabIcon }> = {
  '(beranda)': { title: 'Beranda', Icon: HomeTabIcon },
  riwayat: { title: 'Riwayat', Icon: HistoryTabIcon },
  stok: { title: 'Stok', Icon: StockTabIcon },
  akun: { title: 'Akun', Icon: AccountTabIcon },
};

/**
 * Floating capsule tab bar (iOS style): it hovers above the content with a margin and soft shadow
 * instead of a flat bar glued to the bottom. The active tab sits on a light green pill.
 */
function FloatingTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom - 8, 12) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? colors.brand : colors.textMuted;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.title}
              style={({ pressed }) => [styles.item, focused && styles.itemActive, pressed && { opacity: 0.7 }]}
            >
              <tab.Icon color={color} active={focused} size={24} />
              <Text style={[styles.label, { color }]}>{tab.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="(beranda)" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat' }} />
      <Tabs.Screen name="stok" options={{ title: 'Stok' }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'stretch' },
  bar: {
    flexDirection: 'row',
    height: 64,
    padding: 5,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 27 },
  itemActive: { backgroundColor: colors.brandTint },
  label: { fontSize: 11, fontWeight: '600' },
});
