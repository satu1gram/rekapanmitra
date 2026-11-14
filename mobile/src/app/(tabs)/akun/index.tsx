import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { MitraLevel } from '@/types';

import { levelLabel, updateMitraLevel, updateProfile } from '~/data/profile';
import { useProfile, useRefreshingMutation } from '~/hooks/queries';
import { publicWebUrl } from '~/lib/config';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { buyPricePerBottle } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, ErrorState, Notice } from '~/ui/components';
import { AccountSkeleton } from '~/ui/skeleton';
import { showDialog } from '~/ui/dialog';
import { ChatIcon, FlagIcon, GlobeIcon, LockIcon, LogoutIcon, PeopleIcon, PencilIcon, StoreIcon, TrashIcon, WalletIcon, type IconProps } from '~/ui/icons';
import { Avatar, FieldRow, Group, kitStyles, MenuRow, PageHeader, PillButton, SectionLabel } from '~/ui/kit';
import { LevelPicker } from '~/ui/LevelPicker';
import { HeroDecor } from '~/ui/brand';
import { colors, space, TAB_BAR_SPACE, featureAccent, type Accent } from '~/ui/theme';
import { usePullRefresh } from '~/ui/usePullRefresh';

const FEATURES: { title: string; subtitle: string; Icon: (p: IconProps) => React.ReactNode; href: Href; accent: Accent }[] = [
  { title: 'Pelanggan', subtitle: 'Data dan riwayat belanja pelanggan', Icon: PeopleIcon, href: '/pelanggan', accent: featureAccent.customers },
  { title: 'Pengeluaran & pemasukan', subtitle: 'Pengeluaran usaha dan pemasukan di luar penjualan', Icon: WalletIcon, href: '/keuangan', accent: featureAccent.finance },
  { title: 'Target bulanan', subtitle: 'Target untung, botol terjual, dan restok', Icon: FlagIcon, href: '/target', accent: featureAccent.target },
  { title: 'Toko online', subtitle: 'Link toko dan cara pembayaran', Icon: StoreIcon, href: '/toko', accent: featureAccent.store },
  { title: 'Isi dari chat', subtitle: 'Asisten AI mengisi draf order dari chat', Icon: ChatIcon, href: '/asisten', accent: featureAccent.chat },
];

export default function AccountScreen() {
  const { email, signOut } = useAuth();
  const profile = useProfile();
  const pull = usePullRefresh(() => profile.refetch());
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

  if (profile.isPending) return <View style={kitStyles.page}><PageHeader title="Akun" back={false} /><View style={kitStyles.content}><AccountSkeleton /></View></View>;
  if (profile.isError || !profile.data) {
    return <View style={kitStyles.page}><PageHeader title="Akun" back={false} /><ErrorState message={errorMessage(profile.error, 'Profil tidak ditemukan.')} onRetry={() => profile.refetch()} /></View>;
  }
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
    showDialog('Keluar dari akun?', 'Kamu perlu masuk lagi untuk melihat data.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <KeyboardAvoidingView style={kitStyles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageHeader title="Akun" back={false} />
      <ScrollView
        contentContainerStyle={[kitStyles.content, { paddingBottom: TAB_BAR_SPACE }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.brand} />}
      >
        {error ? <Notice tone="danger">{error}</Notice> : null}

        {editing === 'profile' ? (
          <View style={{ gap: space.sm }}>
            <SectionLabel>Ubah profil</SectionLabel>
            <Group>
              <FieldRow first label="Nama" value={name} onChangeText={setName} autoCapitalize="words" />
              <FieldRow label="No. WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="mis. 0812 3456 7890" />
            </Group>
            <View style={styles.actions}>
              <PillButton label="Batal" tone="outline" onPress={() => setEditing('none')} style={{ flex: 1 }} />
              <PillButton label="Simpan profil" tone="brand" onPress={submitProfile} loading={saveProfile.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={styles.profile}>
            <Avatar name={p.name || 'M'} size={56} accent="green" />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading" style={{ fontSize: 18, fontWeight: '800' }} numberOfLines={1}>{p.name || 'Mitra'}</AppText>
              <AppText variant="small" color={colors.textMuted} numberOfLines={1}>{email}</AppText>
              {p.phone ? <AppText variant="small" color={colors.textMuted}>{p.phone}</AppText> : null}
            </View>
            <PillButton label="Ubah" Icon={PencilIcon} onPress={() => startEdit('profile')} />
          </View>
        )}

        <View style={{ gap: space.sm }}>
          <SectionLabel>Level mitra</SectionLabel>
          {editing === 'level' ? (
            <>
              <AppText variant="small" color={colors.textMuted}>Level menentukan harga modal untuk order baru. Order lama tidak berubah.</AppText>
              <LevelPicker value={level} onChange={setLevel} />
              {level === 'custom' ? (
                <Group>
                  <FieldRow first label="Nama level" value={customName} onChangeText={setCustomName} placeholder="mis. Distributor" />
                  <FieldRow label="Modal/botol" value={formatNumberInput(customPrice)} onChangeText={t => setCustomPrice(parseRupiahInput(t))} keyboardType="number-pad" placeholder="0" />
                </Group>
              ) : null}
              <View style={styles.actions}>
                <PillButton label="Batal" tone="outline" onPress={() => setEditing('none')} style={{ flex: 1 }} />
                <PillButton label="Simpan level" tone="brand" onPress={submitLevel} loading={saveLevel.isPending} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <View style={styles.level}>
              <HeroDecor />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="heading" color={colors.white} style={{ fontWeight: '800' }}>{levelLabel(p)}</AppText>
                <AppText variant="small" color="#E4F3EA">Modal {formatRupiah(buyPricePerBottle(p.mitra_level, p.custom_buy_price))} per botol</AppText>
              </View>
              <PillButton label="Ganti" tone="outline" onPress={() => startEdit('level')} />
            </View>
          )}
        </View>

        <View style={{ gap: space.sm }}>
          <SectionLabel>Usaha</SectionLabel>
          <Group>
            {FEATURES.map((f, i) => <MenuRow key={f.title} first={i === 0} title={f.title} subtitle={f.subtitle} Icon={f.Icon} accent={f.accent} onPress={() => router.push(f.href)} />)}
          </Group>
        </View>

        <View style={{ gap: space.sm }}>
          <SectionLabel>Lainnya</SectionLabel>
          <Group>
            <MenuRow first title="Buka versi web" subtitle="Laporan lengkap di browser" Icon={GlobeIcon} tone="muted" onPress={() => WebBrowser.openBrowserAsync(publicWebUrl('/dashboard'))} />
            <MenuRow title="Kebijakan privasi" subtitle="Data apa yang disimpan dan cara menghapusnya" Icon={LockIcon} tone="muted" onPress={() => WebBrowser.openBrowserAsync(publicWebUrl('/kebijakan-privasi'))} />
            <MenuRow title="Keluar" Icon={LogoutIcon} tone="danger" chevron={false} onPress={confirmSignOut} />
            <MenuRow title="Hapus akun" subtitle="Hapus akun dan semua data secara permanen" Icon={TrashIcon} tone="muted" onPress={() => router.push('/hapus-akun')} />
          </Group>
        </View>

        <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>Rekapan Mitra {Constants.expoConfig?.version ?? ''}</AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 18, padding: 14 },
  level: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brand, borderRadius: 18, padding: 14, overflow: 'hidden' },
  actions: { flexDirection: 'row', gap: 8 },
});
