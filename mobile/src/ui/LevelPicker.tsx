import { Pressable, StyleSheet, View } from 'react-native';
import { MITRA_LEVELS, type MitraLevel } from '@/types';

import { formatRupiah } from '~/lib/money';
import { AppText } from './components';
import { colors, space } from './theme';

const ORDER: MitraLevel[] = ['reseller', 'agen', 'agen_plus', 'sap', 'se', 'custom'];

export function LevelPicker({ value, onChange }: { value: MitraLevel; onChange: (level: MitraLevel) => void }) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      {ORDER.map(level => {
        const info = MITRA_LEVELS[level];
        const selected = level === value;
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${info.label}${level === 'custom' ? '' : `, modal ${formatRupiah(info.buyPricePerBottle)} per botol`}`}
            style={[styles.option, level !== ORDER[0] && styles.sep]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">{info.label}</AppText>
              <AppText variant="small" color={colors.textMuted}>
                {level === 'custom' ? 'Isi nama level dan harga modal sendiri' : `Modal ${formatRupiah(info.buyPricePerBottle)} / botol`}
              </AppText>
            </View>
            <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14 },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 54, paddingVertical: 8 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.brand },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.brand },
});
