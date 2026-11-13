import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentMonth, MONTH_SHORT, type MonthRef } from '~/lib/dates';
import { AppText } from './components';
import { ChevronIcon, CloseIcon } from './icons';
import { colors, radius, space } from './theme';

/** How far back the year switcher goes. Older data is rare; the arrows simply stop there. */
const OLDEST_YEAR = 2020;

/**
 * Bottom sheet to jump to any month: year on top (‹ 2026 ›), then a 4×3 grid of months.
 * Months after the current one are disabled; the current month has a ring, the chosen one is filled.
 */
export function MonthPicker({ visible, value, onClose, onPick }: { visible: boolean; value: MonthRef; onClose: () => void; onPick: (m: MonthRef) => void }) {
  const now = currentMonth();
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState(value.year);
  const pick = (m: MonthRef) => {
    onPick(m);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) + 4 }]}>
        <View style={styles.head}>
          <AppText variant="heading" style={{ flex: 1, fontSize: 18, fontWeight: '800' }}>Pilih bulan</AppText>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Tutup" style={styles.close}>
            <CloseIcon size={16} color="#3A3A3C" />
          </Pressable>
        </View>

        <View style={styles.yearRow}>
          <Pressable onPress={() => setYear(y => y - 1)} disabled={year <= OLDEST_YEAR} accessibilityRole="button" accessibilityLabel="Tahun sebelumnya" style={[styles.yearBtn, year <= OLDEST_YEAR && { opacity: 0.3 }]}>
            <ChevronIcon direction="left" size={18} color={colors.text} />
          </Pressable>
          <AppText variant="title" style={{ flex: 1, textAlign: 'center', fontSize: 20 }} accessibilityLabel={`Tahun ${year}`}>{year}</AppText>
          <Pressable onPress={() => setYear(y => y + 1)} disabled={year >= now.year} accessibilityRole="button" accessibilityLabel="Tahun berikutnya" style={[styles.yearBtn, year >= now.year && { opacity: 0.3 }]}>
            <ChevronIcon direction="right" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {MONTH_SHORT.map((short, month) => {
            const future = year > now.year || (year === now.year && month > now.month);
            const selected = year === value.year && month === value.month;
            const isNow = year === now.year && month === now.month;
            return (
              <View key={short} style={styles.cell}>
                <Pressable
                  onPress={() => pick({ year, month })}
                  disabled={future}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: future }}
                  accessibilityLabel={`${short} ${year}`}
                  style={({ pressed }) => [styles.month, selected && styles.monthOn, !selected && isNow && styles.monthNow, pressed && { opacity: 0.7 }]}
                >
                  <AppText variant="bodyStrong" color={selected ? colors.white : future ? '#C7C7CC' : colors.text} style={{ fontSize: 15 }}>{short}</AppText>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Pressable onPress={() => pick(now)} accessibilityRole="button" style={({ pressed }) => [styles.nowBtn, pressed && { opacity: 0.7 }]}>
          <AppText variant="bodyStrong" color={colors.brand}>Kembali ke bulan ini</AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: space.lg, paddingTop: space.lg, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center' },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  yearRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.fill, borderRadius: radius.pill, padding: 4 },
  yearBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { width: '25%', padding: 4 },
  month: { minHeight: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.fill },
  monthOn: { backgroundColor: colors.brand },
  monthNow: { borderWidth: 1.5, borderColor: colors.brand, backgroundColor: colors.white },
  nowBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
