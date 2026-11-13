import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { currentMonth, monthLabel, shiftMonth, type MonthRef } from '~/lib/dates';
import { AppText } from './components';
import { ChevronIcon } from './icons';
import { MonthPicker } from './MonthPicker';
import { colors, radius } from './theme';

/** White pill: ‹ November 2026 ▾ ›. The label opens the month & year picker. */
export function MonthSwitcher({ value, onChange }: { value: MonthRef; onChange: (m: MonthRef) => void }) {
  const now = currentMonth();
  const isCurrent = value.year === now.year && value.month === now.month;
  const [picking, setPicking] = useState(false);
  return (
    <View style={styles.wrap}>
      <MonthPicker key={picking ? 'open' : 'closed'} visible={picking} value={value} onClose={() => setPicking(false)} onPick={onChange} />
      <Pressable onPress={() => onChange(shiftMonth(value, -1))} accessibilityRole="button" accessibilityLabel="Bulan sebelumnya" style={styles.arrow} hitSlop={6}>
        <ChevronIcon direction="left" size={18} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => setPicking(true)} accessibilityRole="button" accessibilityLabel={`${monthLabel(value)}. Ketuk untuk memilih bulan dan tahun.`} style={({ pressed }) => [styles.label, pressed && { opacity: 0.7 }]}>
        <AppText variant="bodyStrong">{monthLabel(value)}</AppText>
        <ChevronIcon direction="down" size={14} color={colors.textMuted} />
      </Pressable>
      <Pressable
        onPress={() => onChange(shiftMonth(value, 1))}
        disabled={isCurrent}
        accessibilityRole="button"
        accessibilityLabel="Bulan berikutnya"
        accessibilityState={{ disabled: isCurrent }}
        style={[styles.arrow, isCurrent && { opacity: 0.3 }]}
        hitSlop={6}
      >
        <ChevronIcon direction="right" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.pill, padding: 4 },
  arrow: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.fill },
  label: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
