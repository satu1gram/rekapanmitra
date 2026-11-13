import { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
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
  /** Extra content between the message and the buttons, e.g. an order summary. */
  body?: ReactNode;
  actions: DialogAction[];
}

/*
 * The dialog is drawn as an overlay inside the top-most screen that has a <DialogHost />, not with
 * <Modal>: on iOS a React Native Modal cannot be presented while a native modal screen (Order baru,
 * Catat restok, ...) is already on screen, so the dialog would silently never appear.
 */
let current: DialogRequest | null = null;
let hosts: number[] = [];
let nextHostId = 1;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

/** In-app replacement for Alert.alert: same arguments, drawn with the app's own design. */
export function showDialog(title: string, message?: string, actions: DialogAction[] = [{ text: 'Oke' }], body?: ReactNode) {
  current = { title, message, actions, body };
  notify();
}

function closeDialog() {
  current = null;
  notify();
}

/** Mount once at the root and once inside every modal screen; the last mounted host shows the dialog. */
export function DialogHost() {
  const [id] = useState(() => nextHostId++);
  const [, force] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    hosts = [...hosts, id];
    const listener = () => force(n => n + 1);
    listeners.add(listener);
    notify();
    return () => {
      hosts = hosts.filter(h => h !== id);
      listeners.delete(listener);
      notify();
    };
  }, [id]);

  const dialog = hosts[hosts.length - 1] === id ? current : null;
  const cancel = dialog?.actions.find(a => a.style === 'cancel');

  useEffect(() => {
    if (!dialog) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDialog();
      cancel?.onPress?.();
      return true;
    });
    return () => sub.remove();
  }, [dialog, cancel]);

  if (!dialog) return null;
  const close = (action?: DialogAction) => {
    closeDialog();
    action?.onPress?.();
  };
  const ordered = [...dialog.actions.filter(a => a.style !== 'cancel'), ...(cancel ? [cancel] : [])];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={() => close(cancel)} accessibilityLabel="Tutup" accessibilityRole="button" />
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.lg) }]} pointerEvents="box-none">
        <View style={styles.card} accessibilityRole="alert" accessibilityViewIsModal>
          <AppText variant="heading" style={styles.title}>{dialog.title}</AppText>
          {dialog.message ? <AppText variant="body" color={colors.textMuted} style={{ lineHeight: 20 }}>{dialog.message}</AppText> : null}
          {dialog.body}
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
                  <AppText variant="bodyStrong" color={secondary ? colors.text : colors.white} style={{ fontSize: 15, fontWeight: '700' }}>{action.text}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', paddingHorizontal: 12 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 20, gap: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  actions: { gap: 8, marginTop: 12 },
  btn: { minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  btnSecondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.borderStrong },
});
