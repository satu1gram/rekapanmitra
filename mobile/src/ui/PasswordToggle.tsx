import { Pressable } from 'react-native';

import { AppText } from './components';
import { colors } from './theme';

/** "Lihat" / "Tutup" next to a password field. */
export function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={visible ? 'Sembunyikan sandi' : 'Tampilkan sandi'}>
      <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>{visible ? 'Tutup' : 'Lihat'}</AppText>
    </Pressable>
  );
}
