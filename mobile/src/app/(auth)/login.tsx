import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import appIcon from '../../../assets/images/icon.png';
import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { HeroDecor, ON_BRAND_MUTED } from '~/ui/brand';
import { AppText } from '~/ui/components';
import { ChevronIcon } from '~/ui/icons';
import { FieldRow, Group, PillButton } from '~/ui/kit';
import { PasswordToggle } from '~/ui/PasswordToggle';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { accents, colors, space } from '~/ui/theme';

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
      setError('Isi email dan kata sandi dulu.');
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <HeroDecor />
          {router.canGoBack() ? (
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali" hitSlop={8} style={styles.back}>
              <ChevronIcon direction="left" size={20} color={colors.white} />
            </Pressable>
          ) : null}
          <Image source={appIcon} style={styles.logo} accessibilityLabel="Rekapan Mitra" />
          <AppText variant="title" color={colors.white} style={{ fontSize: 24, lineHeight: 30, marginTop: 10 }}>Selamat datang kembali</AppText>
          <AppText variant="body" color={ON_BRAND_MUTED} style={{ fontSize: 15, lineHeight: 22 }}>Masuk untuk lanjut mencatat order dan stok usahamu.</AppText>
        </View>

        <View style={[styles.sheet, { paddingBottom: 24 }]}>
          {error ? (
            <View style={styles.error} accessibilityRole="alert">
              <AppText variant="small" color={accents.rose.fg} style={{ fontWeight: '600', fontSize: 14 }}>{error}</AppText>
            </View>
          ) : null}
          <Group>
            <FieldRow
              first
              label="Email"
              value={email}
              onChangeText={t => { setEmail(t); setError(null); }}
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
              onChangeText={t => { setPassword(t); setError(null); }}
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
            <AppText variant="small" color={colors.brand} style={{ fontWeight: '700', fontSize: 14 }}>Lupa kata sandi?</AppText>
          </Pressable>

          <View style={styles.register}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">Baru di Rekapan Mitra?</AppText>
              <AppText variant="small" color={colors.textMuted}>Akun yang sama bisa dipakai di HP dan web.</AppText>
            </View>
            <PillButton label="Daftar" onPress={() => router.push('/register')} />
          </View>
        </View>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label="Masuk" onPress={submit} loading={busy} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, paddingHorizontal: 24, paddingBottom: 56, gap: 8, overflow: 'hidden' },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, borderRadius: 16 },
  sheet: { flex: 1, marginTop: -28, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: space.lg, paddingTop: 20, gap: 14 },
  error: { borderRadius: 14, backgroundColor: accents.rose.bg, paddingHorizontal: 14, paddingVertical: 10 },
  link: { alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center', marginTop: -4 },
  register: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 18, padding: 14, marginTop: 6 },
});
