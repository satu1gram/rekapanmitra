import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { DELETE_CONFIRM_TEXT, deleteMyAccount } from '~/data/account';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Notice } from '~/ui/components';
import { TrashIcon } from '~/ui/icons';
import { FieldRow, Group, kitStyles, PageHeader, SectionLabel } from '~/ui/kit';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { colors, space } from '~/ui/theme';
import { showDialog } from '~/ui/dialog';
import { KeyboardSafeView } from '~/ui/KeyboardSafeView';

const DELETED = [
  'Profil dan akun login',
  'Semua order, rincian produk, dan biaya tambahannya',
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
      showDialog('Akun dihapus', 'Akun dan semua data usahamu sudah dihapus permanen.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Akun gagal dihapus.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardSafeView style={kitStyles.page}>
      <PageHeader title="Hapus akun" />
      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.warn}>
          <View style={styles.warnIcon}><TrashIcon size={22} color={colors.danger} /></View>
          <AppText variant="heading" color={colors.danger} style={{ fontWeight: '800' }}>Penghapusan permanen</AppText>
          <AppText variant="small" color={colors.text} style={{ lineHeight: 19 }}>
            Akun {email} dan semua datanya akan dihapus dari aplikasi dan web Rekapan Mitra. Data tidak bisa dikembalikan.
          </AppText>
        </View>

        <View style={{ gap: space.sm }}>
          <SectionLabel>Yang akan dihapus</SectionLabel>
          <Group>
            {DELETED.map((item, i) => (
              <View key={item} style={[styles.item, i > 0 && styles.sep]}>
                <View style={styles.dot} />
                <AppText variant="body" style={{ flex: 1 }}>{item}</AppText>
              </View>
            ))}
          </Group>
          <AppText variant="small" color={colors.textMuted}>Ingin menyimpan catatan dulu? Buka Riwayat dan bagikan nota yang kamu perlukan sebelum menghapus.</AppText>
        </View>

        {error ? <Notice tone="danger">{error}</Notice> : null}

        <View style={{ gap: space.sm }}>
          <SectionLabel>Konfirmasi</SectionLabel>
          <Group>
            <FieldRow first label="Kata sandi" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" placeholder="Kata sandi akun" />
            <FieldRow label="Konfirmasi" value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" autoCorrect={false} placeholder={`Ketik ${DELETE_CONFIRM_TEXT}`} />
          </Group>
          <AppText variant="small" color={colors.textMuted}>Ketik {DELETE_CONFIRM_TEXT} di kolom konfirmasi untuk mengaktifkan tombol hapus.</AppText>
        </View>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label="Hapus akun permanen" tone="danger" onPress={run} loading={busy} disabled={!ready} />
      </StickyFooter>
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  warn: { backgroundColor: colors.dangerSoft, borderRadius: 18, padding: 14, gap: 6 },
  warnIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
});
