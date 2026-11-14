import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Notice } from '~/ui/components';
import { FieldRow, Group, kitStyles, PageHeader } from '~/ui/kit';
import { PasswordToggle } from '~/ui/PasswordToggle';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { StageSteps } from '~/ui/StageSteps';
import { accents, colors, space } from '~/ui/theme';

const STRENGTH = [
  { color: '#DADAE0', text: 'Ketik kata sandi untuk melihat kekuatannya' },
  { color: accents.rose.fg, text: 'Terlalu pendek, minimal 6 karakter' },
  { color: accents.amber.fg, text: 'Cukup. Tambah angka supaya lebih kuat' },
  { color: colors.brand, text: 'Kuat' },
];

function strengthOf(password: string) {
  if (!password) return 0;
  if (password.length < 6) return 1;
  return password.length >= 10 || (/\d/.test(password) && /[a-zA-Z]/.test(password) && password.length >= 8) ? 3 : 2;
}

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const level = strengthOf(password);
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const ready = !!name.trim() && emailOk && password.length >= 6;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp({ name, email, password });
      // Without email confirmation the session starts right away and the app moves on to setup by itself.
      if (needsConfirmation) router.replace({ pathname: '/verify', params: { email: email.trim() } });
    } catch (e) {
      setError(/already registered/i.test(String((e as Error)?.message)) ? 'Email ini sudah terdaftar. Masuk dengan email ini atau pakai email lain.' : errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={kitStyles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageHeader title="Buat akun" />
      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]} keyboardShouldPersistTaps="handled">
        <StageSteps labels={['Akun', 'Verifikasi']} current={0} />
        <View style={{ gap: 6 }}>
          <AppText variant="title" style={{ fontSize: 24, lineHeight: 30 }}>Mulai catat usahamu</AppText>
          <AppText variant="body" color={colors.textMuted} style={{ fontSize: 15, lineHeight: 22 }}>Cukup tiga isian. Akun yang sama bisa dipakai di aplikasi web.</AppText>
        </View>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Group>
          <FieldRow first label="Nama" value={name} onChangeText={setName} autoComplete="name" textContentType="name" autoCapitalize="words" placeholder="mis. Salinov Akbar" />
          <FieldRow label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="nama@email.com" />
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
        <View style={{ gap: 8, paddingHorizontal: 4 }} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[0, 1, 2].map(i => <View key={i} style={[styles.bar, { backgroundColor: i < level ? STRENGTH[level].color : '#DADAE0' }]} />)}
          </View>
          <AppText variant="small" color={level ? STRENGTH[level].color : colors.textMuted} style={{ fontWeight: '600' }}>{STRENGTH[level].text}</AppText>
        </View>
        <AppText variant="small" color={colors.textMuted} style={{ paddingHorizontal: 4, lineHeight: 19 }}>Datamu tersimpan di akun ini dan bisa dihapus kapan saja lewat menu Akun.</AppText>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label={ready ? 'Daftar dan kirim link verifikasi' : 'Lengkapi tiga isian di atas'} onPress={submit} loading={busy} disabled={!ready} />
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="button" style={styles.login}>
          <AppText variant="small" color={colors.textMuted}>Sudah punya akun? <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Masuk</AppText></AppText>
        </Pressable>
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bar: { flex: 1, height: 5, borderRadius: 3 },
  login: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' },
});
