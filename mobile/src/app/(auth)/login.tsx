import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import appIcon from '../../../assets/images/icon.png';
import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { HeroDecor, ON_BRAND_MUTED } from '~/ui/brand';
import { AppText, Notice } from '~/ui/components';
import { FieldRow, Group, kitStyles, PillButton } from '~/ui/kit';
import { PasswordToggle } from '~/ui/PasswordToggle';
import { CapsuleButton } from '~/ui/sheet';
import { colors, radius, space } from '~/ui/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Isi email dan kata sandi.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={kitStyles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <HeroDecor />
          <Image source={appIcon} style={styles.logo} accessibilityIgnoresInvertColors />
          <AppText variant="title" color={colors.white} style={{ fontSize: 24 }}>Rekapan Mitra</AppText>
          <AppText variant="body" color={ON_BRAND_MUTED} style={{ lineHeight: 20 }}>Catat order, stok, dan untung usahamu dalam satu aplikasi.</AppText>
        </View>

        <View style={{ gap: space.sm }}>
          <AppText variant="heading" style={{ fontSize: 18, fontWeight: '800' }}>Masuk ke akunmu</AppText>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Group>
            <FieldRow
              first
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="nama@email.com"
              returnKeyType="next"
            />
            <FieldRow
              label="Kata sandi"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              placeholder="Kata sandi akun"
              returnKeyType="go"
              onSubmitEditing={submit}
              suffix={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />}
            />
          </Group>
          <Pressable onPress={() => router.push('/forgot')} accessibilityRole="button" style={styles.link}>
            <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Lupa kata sandi?</AppText>
          </Pressable>
        </View>

        <CapsuleButton label="Masuk" onPress={submit} loading={busy} />

        <View style={styles.register}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">Belum punya akun?</AppText>
            <AppText variant="small" color={colors.textMuted}>Akun yang sama bisa dipakai di web.</AppText>
          </View>
          <PillButton label="Daftar" onPress={() => router.push('/register')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: space.lg },
  hero: { backgroundColor: colors.brand, borderRadius: radius.xl, padding: 20, gap: 8, overflow: 'hidden' },
  logo: { width: 56, height: 56, borderRadius: 16, marginBottom: 6 },
  link: { alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center' },
  register: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 18, padding: 14 },
});
