import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { formatDate } from '~/lib/dates';
import { AppText, Icon } from './components';
import { colors, radius, space } from './theme';

/** Business date picker. Future dates are not allowed. */
export function DateField({ label, value, onChange, initiallyOpen = false }: { label: string; value: Date; onChange: (d: Date) => void; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const handle = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && date) onChange(date);
  };
  return (
    <View style={{ gap: space.xs }}>
      <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>{label}</AppText>
      <Pressable
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value.toISOString())}. Ketuk untuk mengganti.`}
        style={styles.field}
      >
        <Icon name="calendar-outline" color={colors.brandDark} />
        <AppText variant="body" style={{ flex: 1 }}>{formatDate(value.toISOString())}</AppText>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSubtle} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value}
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
          locale="id-ID"
          accentColor={colors.brand}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
