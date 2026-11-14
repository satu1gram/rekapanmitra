import { StyleSheet, View } from 'react-native';

import { AppText } from './components';
import { CheckIcon } from './icons';
import { colors } from './theme';

/**
 * Connected dots with labels: the same motif as the order stages on Beranda (Dicatat,
 * Selesai), reused for every multi-step flow (sign-up, first-time setup).
 */
export function StageSteps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Langkah ${current + 1} dari ${labels.length}: ${labels[current]}`} style={{ gap: 6 }}>
      <View style={styles.row}>
        {labels.map((label, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <View key={label} style={[styles.cell, i > 0 && { flex: 1 }]}>
              {i > 0 ? <View style={[styles.line, { backgroundColor: i <= current ? colors.brand : '#DADAE0' }]} /> : null}
              <View style={[styles.dot, { borderColor: done || now ? colors.brand : colors.borderStrong, backgroundColor: done ? colors.brand : colors.white }]}>
                {done ? <CheckIcon size={9} color={colors.white} /> : null}
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {labels.map((label, i) => (
          <AppText key={label} variant="caption" color={i <= current ? colors.brandDark : colors.textMuted} style={[styles.label, { fontWeight: i === current ? '800' : '600' }]}>{label}</AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28 },
  cell: { flexDirection: 'row', alignItems: 'center' },
  line: { flex: 1, height: 3, borderRadius: 2 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { width: 72, textAlign: 'center', fontSize: 12, letterSpacing: 0 },
});
