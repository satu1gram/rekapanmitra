import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { DELETE_CONFIRM_TEXT, deleteMyAccount } from '~/data/account';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Button, Card, Icon, Notice, Row, Screen, TextField } from '~/ui/components';
import { colors, space } from '~/ui/theme';

const DELETED = [
  'Profil dan akun login',
  'Semua order, rincian produk, dan biaya order',
  'Catatan stok dan restok',
  'Data pelanggan',
  'Pengeluaran, pemasukan, dan target',
  'Pengaturan toko online (link toko berhenti bekerja)',
  'Foto bukti transfer',
  'Koneksi bot Telegram',
];

export default function DeleteAccountScreen() {
  const { email } = useAuth();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = confirmText.trim().toUpperCase() === DELETE_CONFIRM_TEXT && password.length > 0;

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount(email ?? '', password, confirmText);
      queryClient.clear();
      Alert.alert('Akun dihapus', 'Akun dan semua data usahamu sudah dihapus permanen.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Akun gagal dihapus.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Notice tone="danger" title="Penghapusan permanen">
          Akun {email} dan semua datanya akan dihapus dari aplikasi dan web Rekapan Mitra. Data tidak bisa dikembalikan.
        </Notice>
        <Card>
          <AppText variant="heading">Yang akan dihapus</AppText>
          {DELETED.map(item => (
            <Row key={item} style={{ alignItems: 'flex-start' }}>
              <Icon name="close-circle" size={18} color={colors.danger} />
              <AppText variant="body" style={{ flex: 1 }}>{item}</AppText>
            </Row>
          ))}
          <AppText variant="small" color={colors.textMuted}>
            Ingin menyimpan catatan dulu? Buka Riwayat dan bagikan nota yang kamu perlukan sebelum menghapus.
          </AppText>
        </Card>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Card>
          <TextField label="Kata sandi" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" />
          <View style={{ gap: space.xs }}>
            <TextField
              label={`Ketik ${DELETE_CONFIRM_TEXT} untuk konfirmasi`}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={DELETE_CONFIRM_TEXT}
            />
          </View>
        </Card>
        <Button label="Hapus akun permanen" tone="danger" icon="trash-outline" onPress={run} loading={busy} disabled={!ready} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
