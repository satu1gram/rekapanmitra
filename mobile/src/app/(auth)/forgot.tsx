import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Notice } from '~/ui/components';
import { CheckIcon } from '~/ui/icons';
import { FieldRow, Group, kitStyles, PageHeader } from '~/ui/kit';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { colors, space } from '~/ui/theme';

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
        <AppText variant="small" color={colors.textMuted} style={{ lineHeight: 19 }}>
          Kami kirim link ke email kamu. Buka link itu di browser untuk membuat kata sandi baru, lalu masuk lagi di aplikasi.
        </AppText>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {sent ? (
          <View style={styles.sent}>
            <View style={styles.sentIcon}><CheckIcon size={18} color={colors.white} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">Link terkirim</AppText>
              <AppText variant="small" color={colors.textMuted}>Cek kotak masuk (dan folder spam) di {email.trim()}.</AppText>
            </View>
          </View>
        ) : null}
        <Group>
          <FieldRow first label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="nama@email.com" />
        </Group>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label={sent ? 'Kirim ulang link' : 'Kirim link reset'} onPress={submit} loading={busy} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sent: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brandSoft, borderRadius: 18, padding: 14 },
  sentIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});
