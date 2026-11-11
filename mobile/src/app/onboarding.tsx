import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { MitraLevel } from '@/types';

import { completeOnboarding } from '~/data/profile';
import { useProfile } from '~/hooks/queries';
import { formatNumberInput, parseRupiahInput } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Button, Card, Notice, Row, Screen, Stepper, TextField } from '~/ui/components';
import { LevelPicker } from '~/ui/LevelPicker';
import { colors } from '~/ui/theme';

export default function OnboardingScreen() {
  const { signOut } = useAuth();
  const profile = useProfile();
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile.data?.name ?? '');
  const [phone, setPhone] = useState(profile.data?.phone ?? '');
  const [level, setLevel] = useState<MitraLevel>(profile.data?.mitra_level ?? 'reseller');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [initialStock, setInitialStock] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError('Isi nama kamu.');
    if (level === 'custom' && (!customName.trim() || !customPrice)) return setError('Isi nama level dan harga modal per botol.');
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding({ name, phone, mitraLevel: level, customLevelName: customName, customBuyPrice: customPrice, initialStock });
      await queryClient.invalidateQueries();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <AppText variant="body" color={colors.textMuted}>
          Tiga hal ini dipakai untuk menghitung modal dan keuntungan setiap order. Bisa diubah lagi di menu Akun.
        </AppText>
        {profile.data === null ? (
          <Notice tone="warning">Profil akun belum terbentuk di server. Jika simpan gagal, hubungi admin.</Notice>
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <Card>
          <AppText variant="heading">1. Data diri</AppText>
          <TextField label="Nama" value={name} onChangeText={setName} autoComplete="name" />
          <TextField label="No. WhatsApp (opsional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </Card>

        <Card>
          <AppText variant="heading">2. Level mitra kamu</AppText>
          <LevelPicker value={level} onChange={setLevel} />
          {level === 'custom' ? (
            <>
              <TextField label="Nama level" value={customName} onChangeText={setCustomName} placeholder="Contoh: Distributor" />
              <TextField
                label="Harga modal per botol"
                value={formatNumberInput(customPrice)}
                onChangeText={t => setCustomPrice(parseRupiahInput(t))}
                keyboardType="number-pad"
                placeholder="Contoh: 200.000"
              />
            </>
          ) : null}
        </Card>

        <Card>
          <AppText variant="heading">3. Stok saat ini</AppText>
          <AppText variant="small" color={colors.textMuted}>Jumlah botol yang kamu pegang sekarang. Isi 0 jika belum ada.</AppText>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="bodyStrong">Botol</AppText>
            <Stepper label="stok awal" value={initialStock} onChange={setInitialStock} />
          </Row>
        </Card>

        <Button label="Mulai pakai aplikasi" onPress={submit} loading={busy} />
        <Button label="Keluar akun" tone="ghost" onPress={signOut} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
