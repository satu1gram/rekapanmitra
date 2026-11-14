import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './components';
import { ChevronIcon, CloseIcon } from './icons';
import { colors, radius, space } from './theme';
import { useKeyboardVisible } from './useKeyboard';

/** Grabber, title and close button at the top of a full-height sheet. */
export function SheetHeader({ title, onClose, right }: { title: string; onClose: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.grabberRow}><View style={styles.grabber} /></View>
      <View style={styles.titleRow}>
        <AppText variant="title" style={{ flex: 1, fontSize: 20 }}>{title}</AppText>
        {right}
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup" hitSlop={12} style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}>
          <CloseIcon color="#3A3A3C" />
        </Pressable>
      </View>
    </View>
  );
}

export interface RouteStop {
  label: string;
  value: string;
  marker: 'dot' | 'square';
  action?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Two stops joined by a dotted line (from → to), like a pickup/destination card. */
export function RouteCard({ stops, children }: { stops: RouteStop[]; children?: ReactNode }) {
  return (
    <View style={styles.route}>
      <View style={styles.routeLine} pointerEvents="none" />
      {stops.map((stop, i) => (
        <View key={stop.label}>
          {i > 0 ? <View style={styles.routeSep} /> : null}
          <Pressable
            onPress={stop.onPress}
            disabled={!stop.onPress}
            accessibilityRole={stop.onPress ? 'button' : undefined}
            accessibilityLabel={stop.accessibilityLabel ?? `${stop.label}: ${stop.value}`}
            style={({ pressed }) => [styles.routeRow, pressed && { opacity: 0.6 }]}
          >
            <View style={styles.markerBox}>
              {stop.marker === 'dot' ? <View style={styles.dot} /> : <View style={styles.square} />}
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '500', letterSpacing: 0 }}>{stop.label}</AppText>
              <AppText variant="bodyStrong" numberOfLines={1}>{stop.value}</AppText>
            </View>
            {stop.action ? <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>{stop.action}</AppText> : null}
          </Pressable>
        </View>
      ))}
      {children}
    </View>
  );
}

/** Pill-shaped primary button with the action on the left and an amount on the right. */
export function CapsuleButton({ label, value, onPress, loading, disabled, tone = 'brand' }: { label: string; value?: string; onPress: () => void; loading?: boolean; disabled?: boolean; tone?: 'brand' | 'danger' }) {
  const bg = tone === 'danger' ? colors.danger : colors.brand;
  const inactive = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [styles.capsule, { backgroundColor: bg, opacity: inactive ? 0.5 : pressed ? 0.85 : 1, justifyContent: value ? 'space-between' : 'center' }]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} style={{ flex: 1 }} />
      ) : (
        <>
          <AppText variant="bodyStrong" color={colors.white} style={{ fontSize: 16, fontWeight: '700' }}>{label}</AppText>
          {value ? <AppText variant="bodyStrong" color={colors.white} style={{ fontSize: 16, fontWeight: '700' }}>{value}</AppText> : null}
        </>
      )}
    </Pressable>
  );
}

/** White bar pinned to the bottom of a sheet, above the home indicator. */
export function StickyFooter({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardVisible();
  // With the keyboard up the home-indicator inset is already covered, so keep the bar slim.
  return <View style={[styles.footer, { paddingBottom: keyboard ? space.sm : Math.max(insets.bottom, space.sm) + 2 }, style]}>{children}</View>;
}

/** A tappable settings-like row inside a sheet ("Biaya tambahan · Ongkir Rp12.000 ›"). */
export function SheetRow({ label, value, valueColor = colors.text, onPress, first }: { label: string; value: string; valueColor?: string; onPress?: () => void; first?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${label}: ${value}`} style={({ pressed }) => [styles.sheetRow, !first && styles.sheetRowSep, pressed && { opacity: 0.6 }]}>
      <AppText variant="body" style={{ flex: 1, fontSize: 14 }}>{label}</AppText>
      <AppText variant="body" color={valueColor} style={{ fontSize: 14, fontWeight: '700' }}>{value}</AppText>
      {onPress ? <ChevronIcon direction="right" size={16} color="#AEAEB2" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.white, paddingHorizontal: space.lg, paddingBottom: space.sm },
  grabberRow: { alignItems: 'center', paddingTop: 6, paddingBottom: 6 },
  grabber: { width: 36, height: 5, borderRadius: 3, backgroundColor: '#C7C7CC' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  route: { borderRadius: 18, paddingHorizontal: 14, backgroundColor: colors.white },
  routeLine: { position: 'absolute', left: 23, top: 30, bottom: 30, borderLeftWidth: 2, borderStyle: 'dotted', borderColor: '#B7C7BF' },
  routeSep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 32 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 50, paddingVertical: 6 },
  markerBox: { width: 20, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brand, borderWidth: 3, borderColor: '#D7EEE4' },
  square: { width: 11, height: 11, borderRadius: 3, borderWidth: 2, borderColor: '#3A3A3C', backgroundColor: colors.white },
  capsule: { minHeight: 48, borderRadius: radius.pill, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center' },
  footer: { backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, paddingHorizontal: space.lg, paddingTop: 10, gap: 6 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 46 },
  sheetRowSep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
