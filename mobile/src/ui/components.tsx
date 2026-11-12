import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow, space, type, TAB_BAR_SPACE } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

type TextVariant = keyof typeof type;
export function AppText({
  variant = 'body',
  color = colors.text,
  style,
  children,
  numberOfLines,
  selectable,
  accessibilityLabel,
}: {
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
  selectable?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Text style={[type[variant], { color }, style]} numberOfLines={numberOfLines} selectable={selectable} accessibilityLabel={accessibilityLabel}>
      {children}
    </Text>
  );
}

/** Scrollable screen body with pull-to-refresh. */
export function Screen({
  children,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.brand} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <AppText variant="heading">{children}</AppText>
      {action}
    </View>
  );
}

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost';
export function Button({
  label,
  onPress,
  tone = 'primary',
  icon,
  loading,
  disabled,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const palette = {
    primary: { bg: colors.brand, fg: colors.white, border: colors.brand },
    secondary: { bg: colors.white, fg: colors.text, border: colors.borderStrong },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: '#FECACA' },
    ghost: { bg: 'transparent', fg: colors.brandDark, border: 'transparent' },
  }[tone];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={palette.fg} /> : null}
          <AppText variant="bodyStrong" color={palette.fg}>{label}</AppText>
        </>
      )}
    </Pressable>
  );
}

export function TextField({ label, error, hint, style, ...props }: TextInputProps & { label: string; error?: string | null; hint?: string }) {
    return (
      <View style={styles.field}>
        <AppText variant="small" color={colors.textMuted} style={styles.fieldLabel}>{label}</AppText>
        <TextInput
          placeholderTextColor={colors.textSubtle}
          accessibilityLabel={label}
          style={[styles.input, error ? { borderColor: colors.danger } : null, style]}
          {...props}
        />
        {error ? <AppText variant="small" color={colors.danger}>{error}</AppText> : hint ? <AppText variant="small" color={colors.textSubtle}>{hint}</AppText> : null}
      </View>
    );
}

export function Stepper({ value, onChange, min = 0, label }: { value: number; onChange: (next: number) => void; min?: number; label: string }) {
  return (
    <View style={styles.stepper} accessibilityLabel={`${label}: ${value}`}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        accessibilityRole="button"
        accessibilityLabel={`Kurangi ${label}`}
        style={({ pressed }) => [styles.stepperButton, { opacity: value <= min ? 0.35 : pressed ? 0.6 : 1 }]}
      >
        <Icon name="remove" size={22} color={colors.brandDark} />
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={text => {
          const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
          onChange(Number.isFinite(n) ? Math.max(min, n) : min);
        }}
        keyboardType="number-pad"
        selectTextOnFocus
        accessibilityLabel={`Jumlah ${label}`}
        style={styles.stepperValue}
      />
      <Pressable
        onPress={() => onChange(value + 1)}
        accessibilityRole="button"
        accessibilityLabel={`Tambah ${label}`}
        style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Icon name="add" size={22} color={colors.brandDark} />
      </Pressable>
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <AppText variant="small" color={active ? colors.text : colors.textMuted} style={{ fontWeight: active ? '700' : '500' }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const palette = {
    neutral: { bg: '#F1F5F9', fg: colors.textMuted },
    success: { bg: colors.brandSoft, fg: colors.brandDark },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    info: { bg: colors.infoSoft, fg: colors.info },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" color={palette.fg}>{label}</AppText>
    </View>
  );
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'danger' | 'success'; title?: string; children: ReactNode }) {
  const palette = {
    info: { bg: colors.infoSoft, fg: colors.info, icon: 'information-circle' as IconName },
    warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'warning' as IconName },
    danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' as IconName },
    success: { bg: colors.brandSoft, fg: colors.brandDark, icon: 'checkmark-circle' as IconName },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg }]} accessibilityRole="alert">
      <Icon name={palette.icon} size={20} color={palette.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? <AppText variant="bodyStrong" color={palette.fg}>{title}</AppText> : null}
        <AppText variant="small" color={colors.text}>{children}</AppText>
      </View>
    </View>
  );
}

export function LoadingState({ label = 'Memuat data…' }: { label?: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.brand} size="large" />
      <AppText variant="small" color={colors.textMuted}>{label}</AppText>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.centered}>
      <Icon name="cloud-offline-outline" size={40} color={colors.textSubtle} />
      <AppText variant="bodyStrong" style={{ textAlign: 'center' }}>Data belum bisa dimuat</AppText>
      <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>{message}</AppText>
      {onRetry ? <Button label="Coba lagi" tone="secondary" icon="refresh" onPress={onRetry} style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: IconName; title: string; message?: string; action?: ReactNode }) {
  return (
    <View style={[styles.centered, { paddingVertical: space.xxxl }]}>
      <View style={styles.emptyIcon}><Icon name={icon} size={28} color={colors.brand} /></View>
      <AppText variant="bodyStrong" style={{ textAlign: 'center' }}>{title}</AppText>
      {message ? <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>{message}</AppText> : null}
      {action}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function ListItem({
  title,
  subtitle,
  right,
  icon,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const content = (
    <>
      {icon ? <View style={styles.listIcon}><Icon name={icon} size={20} color={colors.brandDark} /></View> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong" numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText variant="small" color={colors.textMuted} numberOfLines={2}>{subtitle}</AppText> : null}
      </View>
      {right}
      {onPress ? <Icon name="chevron-forward" size={18} color={colors.textSubtle} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.listItem}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: '#F1F5F9' }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: space.lg, gap: space.lg, paddingBottom: TAB_BAR_SPACE },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  button: { minHeight: 46, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  field: { gap: space.xs },
  fieldLabel: { fontWeight: '600' },
  input: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: space.md, paddingVertical: 10, fontSize: 15, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandBorder, backgroundColor: colors.brandSoft },
  stepperButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { width: 56, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text, paddingVertical: 0 },
  segmented: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: radius.md, padding: 3 },
  segment: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.white, ...shadow },
  badge: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: radius.pill },
  notice: { flexDirection: 'row', gap: space.sm, paddingVertical: 10, paddingHorizontal: space.md, borderRadius: radius.md, alignItems: 'flex-start' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xxl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48, paddingVertical: 6 },
  listIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
