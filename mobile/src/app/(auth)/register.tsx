import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';

import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Button, Notice, Screen, TextField } from '~/ui/components';
import { colors } from '~/ui/theme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <Screen>
        <Notice tone="success" title="Cek email kamu">
          Link konfirmasi sudah dikirim ke {sentTo}. Buka link itu, lalu kembali ke aplikasi dan masuk.
        </Notice>
        <Button label="Ke halaman masuk" onPress={() => router.replace('/login')} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <AppText variant="body" color={colors.textMuted}>Akun yang sama bisa dipakai di aplikasi web Rekapan Mitra.</AppText>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <TextField label="Nama lengkap" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        <TextField label="No. WhatsApp (opsional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="08…" />
        <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
        <TextField label="Kata sandi" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" hint="Minimal 6 karakter" />
        <Button label="Daftar" onPress={submit} loading={busy} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
