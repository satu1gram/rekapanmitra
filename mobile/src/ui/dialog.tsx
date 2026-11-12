import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from './components';
import { colors, radius, space } from './theme';

export interface DialogAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface DialogRequest {
  title: string;
  message?: string;
  actions: DialogAction[];
}

let current: DialogRequest | null = null;
const listeners = new Set<(d: DialogRequest | null) => void>();
const publish = (d: DialogRequest | null) => {
  current = d;
  listeners.forEach(l => l(d));
};

/**
 * In-app replacement for Alert.alert: same arguments, but drawn with the app's own design
 * (bottom card, pill buttons) instead of the phone's system dialog. Needs <DialogHost /> once at the root.
 */
export function showDialog(title: string, message?: string, actions: DialogAction[] = [{ text: 'Oke' }]) {
  publish({ title, message, actions });
}

export function DialogHost() {
  const [dialog, setDialog] = useState<DialogRequest | null>(current);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    listeners.add(setDialog);
    return () => {
      listeners.delete(setDialog);
    };
  }, []);

  const close = (action?: DialogAction) => {
    publish(null);
    action?.onPress?.();
  };
  const cancel = dialog?.actions.find(a => a.style === 'cancel');
  const ordered = dialog ? [...dialog.actions.filter(a => a.style !== 'cancel'), ...(cancel ? [cancel] : [])] : [];

  return (
    <Modal visible={!!dialog} transparent animationType="fade" statusBarTranslucent onRequestClose={() => close(cancel)}>
      <Pressable style={styles.backdrop} onPress={() => close(cancel)} accessibilityRole="button" accessibilityLabel="Tutup">
        <Pressable style={[styles.card, { marginBottom: Math.max(insets.bottom, space.lg) }]} onPress={() => undefined} accessibilityRole="alert">
          <AppText variant="heading" style={styles.title}>{dialog?.title ?? ''}</AppText>
          {dialog?.message ? <AppText variant="body" color={colors.textMuted} style={{ lineHeight: 20 }}>{dialog.message}</AppText> : null}
          <View style={styles.actions}>
            {ordered.map(action => {
              const destructive = action.style === 'destructive';
              const secondary = action.style === 'cancel';
              return (
                <Pressable
                  key={action.text}
                  onPress={() => close(action)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.btn,
                    secondary ? styles.btnSecondary : { backgroundColor: destructive ? colors.danger : colors.brand },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <AppText variant="bodyStrong" color={secondary ? colors.text : colors.white} style={{ fontSize: 14, fontWeight: '700' }}>{action.text}</AppText>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 20, gap: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  actions: { gap: 8, marginTop: 12 },
  btn: { minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  btnSecondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.borderStrong },
});
