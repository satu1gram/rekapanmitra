import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDate, MONTH_NAMES, sameDay } from '~/lib/dates';
import { AppText } from './components';
import { ChevronIcon } from './icons';
import { colors, radius, space } from './theme';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/**
 * Business date picker drawn by the app itself (no system date dialog), the same on iOS and Android.
 * Future dates are not allowed.
 */
export function DateField({ label, value, onChange, initiallyOpen = false }: { label: string; value: Date; onChange: (d: Date) => void; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={{ gap: space.xs }}>
      <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>{label}</AppText>
      <Pressable
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value.toISOString())}. Ketuk untuk mengganti.`}
        style={styles.field}
      >
        <AppText variant="body" style={{ flex: 1 }}>{formatDate(value.toISOString())}</AppText>
        <ChevronIcon direction={open ? 'up' : 'down'} size={16} color={colors.textSubtle} />
      </Pressable>
      {open ? <DateCalendar value={value} onChange={d => { onChange(d); setOpen(false); }} /> : null}
    </View>
  );
}

export function DateCalendar({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const today = new Date();
  const [view, setView] = useState({ year: value.getFullYear(), month: value.getMonth() });
  const first = new Date(view.year, view.month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const atCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const shift = (delta: number) => setView(v => {
    const d = new Date(v.year, v.month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  // Keep the time of day of the current value; only the date changes.
  const pick = (day: number) => {
    const d = new Date(value);
    d.setFullYear(view.year, view.month, day);
    onChange(d);
  };
  const quick = (daysAgo: number) => {
    const d = new Date(value);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
    d.setFullYear(t.getFullYear(), t.getMonth(), t.getDate());
    onChange(d);
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.quickRow}>
        {[['Hari ini', 0], ['Kemarin', 1], ['2 hari lalu', 2]].map(([text, ago]) => (
          <Pressable key={text} onPress={() => quick(ago as number)} accessibilityRole="button" style={({ pressed }) => [styles.quick, pressed && { opacity: 0.7 }]}>
            <AppText variant="small" style={{ fontWeight: '600' }}>{text}</AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.head}>
        <Pressable onPress={() => shift(-1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Bulan sebelumnya" style={styles.nav}>
          <ChevronIcon direction="left" size={18} color={colors.text} />
        </Pressable>
        <AppText variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{MONTH_NAMES[view.month]} {view.year}</AppText>
        <Pressable onPress={() => shift(1)} disabled={atCurrentMonth} hitSlop={8} accessibilityRole="button" accessibilityLabel="Bulan berikutnya" style={[styles.nav, atCurrentMonth && { opacity: 0.3 }]}>
          <ChevronIcon direction="right" size={18} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {WEEKDAYS.map(w => (
          <View key={w} style={styles.cell}><AppText variant="caption" color={colors.textMuted} style={{ letterSpacing: 0 }}>{w}</AppText></View>
        ))}
        {cells.map((day, i) => {
          if (day == null) return <View key={`e${i}`} style={styles.cell} />;
          const date = new Date(view.year, view.month, day);
          const future = date > today && !sameDay(date, today);
          const selected = sameDay(date, value);
          const isToday = sameDay(date, today);
          return (
            <Pressable
              key={day}
              onPress={() => pick(day)}
              disabled={future}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: future }}
              accessibilityLabel={`${day} ${MONTH_NAMES[view.month]} ${view.year}`}
              style={styles.cell}
            >
              <View style={[styles.day, selected && { backgroundColor: colors.brand }, !selected && isToday && { borderWidth: 1.5, borderColor: colors.brand }]}>
                <AppText variant="body" color={selected ? colors.white : future ? '#C7C7CC' : colors.text} style={{ fontWeight: selected || isToday ? '700' : '400' }}>{day}</AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  calendar: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 12, gap: 8 },
  quickRow: { flexDirection: 'row', gap: 6 },
  quick: { paddingHorizontal: 12, minHeight: 32, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.fill },
  head: { flexDirection: 'row', alignItems: 'center' },
  nav: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.fill },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
