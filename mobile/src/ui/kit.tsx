/**
 * Building blocks for the settings-style screens (Akun and everything under it), in the same
 * density as the order sheets: grey page, white 18px cards, 48–56px rows, 14–16px text.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './components';
import { ChevronIcon, type IconProps } from './icons';
import { colors, radius, space, accentForName, accents, type Accent } from './theme';

/** Page title row for pushed screens: round back button, title, optional action on the right. */
export function PageHeader({ title, right, back = true }: { title: string; right?: ReactNode; back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      {back ? (
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali" hitSlop={8} style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}>
          <ChevronIcon direction="left" size={20} color={colors.text} />
        </Pressable>
      ) : null}
      <AppText variant="title" style={{ flex: 1, fontSize: back ? 18 : 22 }} numberOfLines={1}>{title}</AppText>
      {right}
    </View>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionLabel}>
      <AppText variant="heading" style={{ flex: 1, fontSize: 16, fontWeight: '800' }}>{children}</AppText>
      {right}
    </View>
  );
}

/** White rounded card; rows inside get hairline separators via `first`. */
export function Group({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.group, style]}>{children}</View>;
}

/** Tappable menu row: tinted icon, title + subtitle, value and chevron. */
export function MenuRow({ title, subtitle, Icon, value, onPress, first, tone = 'brand', accent, chevron = true }: {
  title: string;
  subtitle?: string;
  Icon?: (p: IconProps) => ReactNode;
  value?: string;
  onPress?: () => void;
  first?: boolean;
  tone?: 'brand' | 'danger' | 'muted';
  /** Feature colour for the icon tile (see featureAccent). */
  accent?: Accent;
  chevron?: boolean;
}) {
  const fg = accent ? accents[accent].fg : tone === 'danger' ? colors.danger : tone === 'muted' ? colors.textMuted : colors.brand;
  const bg = accent ? accents[accent].bg : tone === 'danger' ? colors.dangerSoft : tone === 'muted' ? colors.fill : colors.brandSoft;
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title} style={({ pressed }) => [styles.row, !first && styles.sep, pressed && { opacity: 0.6 }]}>
      {Icon ? <View style={[styles.iconBox, { backgroundColor: bg }]}><Icon size={20} color={fg} /></View> : null}
      <View style={{ flex: 1, gap: 1 }}>
        <AppText variant="bodyStrong" color={tone === 'danger' ? colors.danger : colors.text} style={{ fontSize: 15 }}>{title}</AppText>
        {subtitle ? <AppText variant="small" color={colors.textMuted} numberOfLines={2}>{subtitle}</AppText> : null}
      </View>
      {value ? <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>{value}</AppText> : null}
      {onPress && chevron ? <ChevronIcon direction="right" size={16} color="#AEAEB2" /> : null}
    </Pressable>
  );
}

/** Label on the left, input on the right, inside a Group. */
export function FieldRow({ label, first, suffix, multiline, ...input }: TextInputProps & { label: string; first?: boolean; suffix?: ReactNode }) {
  return (
    <View style={[styles.field, multiline && { alignItems: 'flex-start', paddingVertical: 12 }, !first && styles.sep]}>
      <AppText variant="body" color={colors.label} style={[styles.fieldLabel, multiline && { paddingTop: 2 }]}>{label}</AppText>
      <TextInput
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={label}
        multiline={multiline}
        {...input}
        style={[styles.input, multiline && { minHeight: 60, textAlignVertical: 'top', paddingVertical: 0 }]}
      />
      {suffix}
    </View>
  );
}

/** Small rounded button used inside cards ("Ubah", "Bagikan"). */
export function PillButton({ label, onPress, tone = 'soft', Icon, loading, disabled, style }: {
  label: string;
  onPress: () => void;
  tone?: 'soft' | 'brand' | 'outline' | 'danger';
  Icon?: (p: IconProps) => ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    soft: { bg: colors.brandSoft, fg: colors.brandDark, border: colors.brandSoft },
    brand: { bg: colors.brand, fg: colors.white, border: colors.brand },
    outline: { bg: colors.white, fg: colors.text, border: colors.borderStrong },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  }[tone];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [styles.pill, { backgroundColor: palette.bg, borderColor: palette.border, opacity: inactive ? 0.5 : pressed ? 0.8 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={palette.fg} /> : (
        <>
          {Icon ? <Icon size={16} color={palette.fg} /> : null}
          <AppText variant="small" color={palette.fg} style={{ fontWeight: '700', fontSize: 14 }}>{label}</AppText>
        </>
      )}
    </Pressable>
  );
}

/** Initial in a soft circle; the colour is fixed per name so the same customer always looks the same. */
export function Avatar({ name, size = 44, accent }: { name: string; size?: number; accent?: Accent }) {
  const a = accents[accent ?? accentForName(name || '?')];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: a.bg, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="bodyStrong" color={a.fg} style={{ fontSize: Math.round(size * 0.4), fontWeight: '800' }}>{(name || '?').trim().slice(0, 1).toUpperCase()}</AppText>
    </View>
  );
}

/** Horizontal pill tabs (Semua / Belum selesai ...). The selected one is dark. */
export function PillTabs<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.tabs} accessibilityRole="radiogroup">
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[styles.tab, on && styles.tabOn]}>
            <AppText variant="small" color={on ? colors.white : colors.text} style={{ fontWeight: '700' }}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export const kitStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.lg },
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.lg, paddingBottom: 10, backgroundColor: colors.bg },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: -6 },
  group: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  fieldLabel: { width: 108, fontSize: 14, fontWeight: '500' },
  input: { flex: 1, minWidth: 0, width: 0, fontSize: 15, fontWeight: '600', color: colors.text, paddingVertical: 10 },
  pill: { minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { minHeight: 34, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: colors.white },
  tabOn: { backgroundColor: colors.text },
});
