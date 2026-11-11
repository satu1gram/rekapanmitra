import { useState } from 'react';

import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Button, Notice, Screen, TextField } from '~/ui/components';
import { colors } from '~/ui/theme';

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
    <Screen>
      <AppText variant="body" color={colors.textMuted}>
        Kami kirim link ke email kamu. Buka link itu di browser untuk membuat kata sandi baru, lalu masuk lagi di aplikasi.
      </AppText>
      {sent ? <Notice tone="success" title="Link terkirim">Cek kotak masuk (dan folder spam) di {email.trim()}.</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Button label={sent ? 'Kirim ulang' : 'Kirim link reset'} onPress={submit} loading={busy} />
    </Screen>
  );
}
