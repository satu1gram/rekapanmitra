import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './components';
import { colors, radius, space } from './theme';

export function Chips<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {options.map(o => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{ selected: active }} style={[styles.chip, active && styles.active]}>
            <AppText variant="small" color={active ? colors.white : colors.text} style={{ fontWeight: '600' }}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 40, paddingHorizontal: space.md, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  active: { backgroundColor: colors.brand, borderColor: colors.brand },
});
