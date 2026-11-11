import { Pressable, StyleSheet, View } from 'react-native';

import { currentMonth, monthLabel, shiftMonth, type MonthRef } from '~/lib/dates';
import { AppText, Icon } from './components';
import { colors, radius } from './theme';

export function MonthSwitcher({ value, onChange }: { value: MonthRef; onChange: (m: MonthRef) => void }) {
  const now = currentMonth();
  const isCurrent = value.year === now.year && value.month === now.month;
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => onChange(shiftMonth(value, -1))} accessibilityRole="button" accessibilityLabel="Bulan sebelumnya" style={styles.arrow} hitSlop={8}>
        <Icon name="chevron-back" color={colors.brandDark} />
      </Pressable>
      <Pressable onPress={() => onChange(now)} accessibilityRole="button" accessibilityLabel={`${monthLabel(value)}. Ketuk untuk kembali ke bulan ini.`} style={styles.label}>
        <AppText variant="bodyStrong">{monthLabel(value)}</AppText>
        {!isCurrent ? <AppText variant="caption" color={colors.brandDark}>Ketuk untuk bulan ini</AppText> : null}
      </Pressable>
      <Pressable
        onPress={() => onChange(shiftMonth(value, 1))}
        disabled={isCurrent}
        accessibilityRole="button"
        accessibilityLabel="Bulan berikutnya"
        accessibilityState={{ disabled: isCurrent }}
        style={[styles.arrow, isCurrent && { opacity: 0.3 }]}
        hitSlop={8}
      >
        <Icon name="chevron-forward" color={colors.brandDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  arrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
});
