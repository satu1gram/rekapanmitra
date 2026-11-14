import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';

import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Notice } from '~/ui/components';
import { CheckIcon } from '~/ui/icons';
import { FieldRow, Group, kitStyles, PageHeader } from '~/ui/kit';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { accents, colors, space } from '~/ui/theme';

export default function ForgotScreen() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Format email belum benar.');
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={kitStyles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageHeader title="Lupa kata sandi" />
      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.lock}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={accents.amber.fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="5" y="11" width="14" height="10" rx="3" fill={accents.amber.fg} fillOpacity={0.22} />
            <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </Svg>
        </View>
        <View style={{ gap: 6 }}>
          <AppText variant="title" style={{ fontSize: 24, lineHeight: 30 }}>Atur ulang kata sandi</AppText>
          <AppText variant="body" color={colors.textMuted} style={{ fontSize: 15, lineHeight: 22 }}>Masukkan email akunmu. Kami kirim link untuk membuat kata sandi baru di browser.</AppText>
        </View>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Group>
          <FieldRow first label="Email" value={email} onChangeText={t => { setEmail(t); setError(null); }} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="nama@email.com" />
        </Group>
        {sent ? (
          <View style={styles.sent} accessibilityRole="alert">
            <View style={styles.sentIcon}><CheckIcon size={16} color={colors.white} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">Link terkirim</AppText>
              <AppText variant="small" color={colors.textMuted}>Cek kotak masuk dan folder spam di {email.trim()}.</AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label={sent ? 'Kirim ulang link' : 'Kirim link reset'} onPress={submit} loading={busy} />
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="button" style={styles.back}>
          <AppText variant="bodyStrong" color={colors.brand} style={{ fontWeight: '700' }}>Kembali ke halaman masuk</AppText>
        </Pressable>
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  lock: { width: 64, height: 64, borderRadius: 20, backgroundColor: accents.amber.bg, alignItems: 'center', justifyContent: 'center' },
  sent: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brandSoft, borderRadius: 18, padding: 14 },
  sentIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
