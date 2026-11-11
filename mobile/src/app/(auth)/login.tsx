import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import appIcon from '../../../assets/images/icon.png';
import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Button, Notice, Screen, TextField } from '~/ui/components';
import { colors, space } from '~/ui/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen contentStyle={styles.content}>
          <View style={styles.brand}>
            <Image source={appIcon} style={styles.logo} accessibilityIgnoresInvertColors />
            <AppText variant="title">Rekapan Mitra</AppText>
            <AppText variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
              Catat order, stok, dan keuntungan usahamu.
            </AppText>
          </View>

          {error ? <Notice tone="danger">{error}</Notice> : null}

          <TextField
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
          <TextField
            label="Kata sandi"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          <Button label="Masuk" onPress={submit} loading={busy} />

          <Button label="Lupa kata sandi?" tone="ghost" onPress={() => router.push('/forgot')} />

          <View style={styles.footer}>
            <AppText variant="body" color={colors.textMuted}>Belum punya akun?</AppText>
            <Button label="Daftar" tone="secondary" onPress={() => router.push('/register')} style={{ alignSelf: 'stretch' }} />
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.xxxl, gap: space.lg },
  brand: { alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  logo: { width: 88, height: 88, borderRadius: 22 },
  footer: { alignItems: 'center', gap: space.sm, marginTop: space.lg },
});
