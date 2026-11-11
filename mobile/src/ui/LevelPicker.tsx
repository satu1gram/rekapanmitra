import { Pressable, StyleSheet, View } from 'react-native';
import { MITRA_LEVELS, type MitraLevel } from '@/types';

import { formatRupiah } from '~/lib/money';
import { AppText, Icon } from './components';
import { colors, radius, space } from './theme';

const ORDER: MitraLevel[] = ['reseller', 'agen', 'agen_plus', 'sap', 'se', 'custom'];

export function LevelPicker({ value, onChange }: { value: MitraLevel; onChange: (level: MitraLevel) => void }) {
  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
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
            style={[styles.option, selected && styles.optionSelected]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">{info.label}</AppText>
              <AppText variant="small" color={colors.textMuted}>
                {level === 'custom' ? 'Isi nama level dan harga modal sendiri' : `Modal ${formatRupiah(info.buyPricePerBottle)} / botol`}
              </AppText>
            </View>
            <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.brand : colors.borderStrong} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  optionSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
});
