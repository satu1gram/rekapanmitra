import { useState } from 'react';
import { Alert, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { MitraLevel } from '@/types';

import { levelLabel, updateMitraLevel, updateProfile } from '~/data/profile';
import { useProfile, useRefreshingMutation } from '~/hooks/queries';
import { publicWebUrl } from '~/lib/config';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { buyPricePerBottle } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Badge, Button, Card, Divider, ErrorState, ListItem, LoadingState, Notice, Screen, SectionTitle, TextField, type IconName } from '~/ui/components';
import { LevelPicker } from '~/ui/LevelPicker';
import { colors } from '~/ui/theme';

const FEATURES: { title: string; subtitle: string; icon: IconName; href: '/keuangan' | '/target' | '/pelanggan' | '/toko' | '/asisten' }[] = [
  { title: 'Pengeluaran & pemasukan', subtitle: 'Biaya umum dan pemasukan di luar penjualan', icon: 'wallet-outline', href: '/keuangan' },
  { title: 'Target bulanan', subtitle: 'Target untung, penjualan, dan restok', icon: 'flag-outline', href: '/target' },
  { title: 'Pelanggan', subtitle: 'Data dan riwayat belanja pelanggan', icon: 'people-outline', href: '/pelanggan' },
  { title: 'Toko online', subtitle: 'Link toko dan cara pembayaran', icon: 'storefront-outline', href: '/toko' },
  { title: 'Asisten AI', subtitle: 'Isi order dari teks chat', icon: 'sparkles-outline', href: '/asisten' },
];

export default function AccountScreen() {
  const { email, signOut } = useAuth();
  const profile = useProfile();
  const [editing, setEditing] = useState<'none' | 'profile' | 'level'>('none');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState<MitraLevel>('reseller');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = useRefreshingMutation(updateProfile, ['profile']);
  const saveLevel = useRefreshingMutation(
    (input: { level: MitraLevel; custom?: { name: string; buyPrice: number } }) => updateMitraLevel(input.level, input.custom),
    ['profile'],
  );

  if (profile.isPending) return <LoadingState />;
  if (profile.isError || !profile.data) return <ErrorState message={errorMessage(profile.error, 'Profil tidak ditemukan.')} onRetry={() => profile.refetch()} />;
  const p = profile.data;

  const startEdit = (mode: 'profile' | 'level') => {
    setError(null);
    setName(p.name);
    setPhone(p.phone ?? '');
    setLevel(p.mitra_level);
    setCustomName(p.custom_level_name ?? '');
    setCustomPrice(p.custom_buy_price ?? null);
    setEditing(mode);
  };

  const submitProfile = () => {
    if (!name.trim()) return setError('Nama tidak boleh kosong.');
    saveProfile.mutate({ name: name.trim(), phone: phone.trim() || null }, { onSuccess: () => setEditing('none'), onError: e => setError(errorMessage(e)) });
  };

  const submitLevel = () => {
    if (level === 'custom' && (!customName.trim() || !customPrice)) return setError('Isi nama level dan harga modal per botol.');
    saveLevel.mutate(
      { level, custom: level === 'custom' ? { name: customName, buyPrice: customPrice ?? 0 } : undefined },
      { onSuccess: () => setEditing('none'), onError: e => setError(errorMessage(e)) },
    );
  };

  const confirmSignOut = () =>
    Alert.alert('Keluar dari akun?', 'Kamu perlu masuk lagi untuk melihat data.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <Screen refreshing={profile.isRefetching} onRefresh={() => profile.refetch()}>
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Card>
        {editing === 'profile' ? (
          <>
            <TextField label="Nama" value={name} onChangeText={setName} />
            <TextField label="No. WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Button label="Simpan" onPress={submitProfile} loading={saveProfile.isPending} />
            <Button label="Batal" tone="ghost" onPress={() => setEditing('none')} />
          </>
        ) : (
          <>
            <AppText variant="title">{p.name || 'Mitra'}</AppText>
            <AppText variant="body" color={colors.textMuted}>{email}</AppText>
            {p.phone ? <AppText variant="body" color={colors.textMuted}>{p.phone}</AppText> : null}
            <Button label="Ubah profil" tone="secondary" icon="create-outline" onPress={() => startEdit('profile')} />
          </>
        )}
      </Card>

      <Card>
        <AppText variant="heading">Level mitra</AppText>
        {editing === 'level' ? (
          <>
            <Notice tone="info">Level menentukan harga modal untuk order baru. Order lama tidak berubah.</Notice>
            <LevelPicker value={level} onChange={setLevel} />
            {level === 'custom' ? (
              <>
                <TextField label="Nama level" value={customName} onChangeText={setCustomName} />
                <TextField label="Harga modal per botol" value={formatNumberInput(customPrice)} onChangeText={t => setCustomPrice(parseRupiahInput(t))} keyboardType="number-pad" />
              </>
            ) : null}
            <Button label="Simpan level" onPress={submitLevel} loading={saveLevel.isPending} />
            <Button label="Batal" tone="ghost" onPress={() => setEditing('none')} />
          </>
        ) : (
          <>
            <Badge label={levelLabel(p)} tone="success" />
            <AppText variant="body" color={colors.textMuted}>Modal {formatRupiah(buyPricePerBottle(p.mitra_level, p.custom_buy_price))} per botol</AppText>
            <Button label="Ganti level" tone="secondary" icon="swap-horizontal" onPress={() => startEdit('level')} />
          </>
        )}
      </Card>

      <SectionTitle>Usaha</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {FEATURES.map((f, i) => (
          <View key={f.title}>
            {i > 0 ? <Divider /> : null}
            <ListItem title={f.title} subtitle={f.subtitle} icon={f.icon} onPress={() => router.push(f.href)} />
          </View>
        ))}
      </Card>
      <Button label="Buka versi web" icon="globe-outline" tone="ghost" onPress={() => WebBrowser.openBrowserAsync(publicWebUrl('/dashboard'))} />

      <Button label="Keluar" icon="log-out-outline" tone="danger" onPress={confirmSignOut} />
      <Button label="Hapus akun" tone="ghost" onPress={() => router.push('/hapus-akun')} accessibilityHint="Membuka halaman untuk menghapus akun dan semua data secara permanen" />
      <AppText variant="small" color={colors.textSubtle} style={{ textAlign: 'center' }}>
        Rekapan Mitra {Constants.expoConfig?.version ?? ''}
      </AppText>
    </Screen>
  );
}
