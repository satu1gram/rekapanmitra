import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Notice } from '~/ui/components';
import { CheckIcon } from '~/ui/icons';
import { FieldRow, Group, kitStyles, PageHeader, SectionLabel } from '~/ui/kit';
import { PasswordToggle } from '~/ui/PasswordToggle';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { colors, space } from '~/ui/theme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError('Isi nama kamu.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Format email belum benar.');
    if (password.length < 6) return setError('Kata sandi minimal 6 karakter.');
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp({ name, email, password, phone });
      if (needsConfirmation) setSentTo(email.trim());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <View style={kitStyles.page}>
        <PageHeader title="Daftar akun" />
        <View style={[kitStyles.content, { flex: 1 }]}>
          <View style={styles.done}>
            <View style={styles.doneIcon}><CheckIcon size={24} color={colors.white} /></View>
            <AppText variant="heading" style={{ fontSize: 18, fontWeight: '800' }}>Cek email kamu</AppText>
            <AppText variant="body" color={colors.textMuted} style={{ lineHeight: 20 }}>
              Link konfirmasi sudah dikirim ke <AppText variant="bodyStrong">{sentTo}</AppText>. Buka link itu, lalu kembali ke aplikasi dan masuk. Cek juga folder spam.
            </AppText>
          </View>
        </View>
        <StickyFooter>
          <CapsuleButton label="Ke halaman masuk" onPress={() => router.replace('/login')} />
        </StickyFooter>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={kitStyles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageHeader title="Daftar akun" />
      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]} keyboardShouldPersistTaps="handled">
        <AppText variant="small" color={colors.textMuted}>Akun yang sama bisa dipakai di aplikasi web Rekapan Mitra.</AppText>
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <View style={{ gap: space.sm }}>
          <SectionLabel>Data diri</SectionLabel>
          <Group>
            <FieldRow first label="Nama lengkap" value={name} onChangeText={setName} autoComplete="name" textContentType="name" autoCapitalize="words" placeholder="mis. Salinov Akbar" />
            <FieldRow label="No. WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="Opsional" />
          </Group>
        </View>

        <View style={{ gap: space.sm }}>
          <SectionLabel>Akun</SectionLabel>
          <Group>
            <FieldRow first label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="nama@email.com" />
            <FieldRow
              label="Kata sandi"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Minimal 6 karakter"
              suffix={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />}
            />
          </Group>
        </View>

        <Pressable onPress={() => router.replace('/login')} accessibilityRole="button" style={styles.login}>
          <AppText variant="small" color={colors.textMuted}>Sudah punya akun? <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Masuk</AppText></AppText>
        </Pressable>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label="Daftar" onPress={submit} loading={busy} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  done: { backgroundColor: colors.white, borderRadius: 18, padding: 16, gap: 8 },
  doneIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  login: { alignSelf: 'center', minHeight: 40, justifyContent: 'center' },
});
