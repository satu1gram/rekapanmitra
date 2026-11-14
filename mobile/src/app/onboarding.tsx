import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MitraLevel } from '@/types';

import { completeOnboarding } from '~/data/profile';
import { useProfile } from '~/hooks/queries';
import { formatNumberInput, parseRupiahInput } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { HeroDecor, ON_BRAND_MUTED } from '~/ui/brand';
import { AppText, Notice } from '~/ui/components';
import { MinusIcon, PlusIcon } from '~/ui/icons';
import { FieldRow, Group, kitStyles } from '~/ui/kit';
import { LevelPicker } from '~/ui/LevelPicker';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { colors, radius, space } from '~/ui/theme';

/** First run: name, mitra level (decides cost per bottle) and the stock on hand. */
export default function OnboardingScreen() {
  const { signOut } = useAuth();
  const profile = useProfile();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
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

  const done = [!!name.trim(), level !== 'custom' || (!!customName.trim() && !!customPrice), true];

  return (
    <KeyboardAvoidingView style={kitStyles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <HeroDecor />
          <AppText variant="small" color={ON_BRAND_MUTED}>Pengaturan awal</AppText>
          <AppText variant="title" color={colors.white} style={{ fontSize: 22 }}>Selamat datang{name.trim() ? `, ${name.trim().split(' ')[0]}` : ''}!</AppText>
          <AppText variant="body" color={ON_BRAND_MUTED} style={{ lineHeight: 20 }}>Tiga hal ini dipakai untuk menghitung modal dan untung setiap order. Bisa diubah lagi di menu Akun.</AppText>
          <View style={styles.progress}>
            {done.map((ok, i) => <View key={i} style={[styles.progressPart, { backgroundColor: ok ? colors.white : 'rgba(255,255,255,0.3)' }]} />)}
          </View>
        </View>

        {profile.data === null ? <Notice tone="warning">Profil akun belum terbentuk di server. Jika simpan gagal, hubungi admin.</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <Step n={1} title="Data diri" done={done[0]}>
          <Group>
            <FieldRow first label="Nama" value={name} onChangeText={setName} autoComplete="name" autoCapitalize="words" placeholder="mis. Salinov Akbar" />
            <FieldRow label="No. WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Opsional" />
          </Group>
        </Step>

        <Step n={2} title="Level mitra kamu" note="Menentukan harga modal per botol di setiap order." done={done[1]}>
          <LevelPicker value={level} onChange={setLevel} />
          {level === 'custom' ? (
            <Group>
              <FieldRow first label="Nama level" value={customName} onChangeText={setCustomName} placeholder="mis. Distributor" />
              <FieldRow label="Modal/botol" value={formatNumberInput(customPrice)} onChangeText={t => setCustomPrice(parseRupiahInput(t))} keyboardType="number-pad" placeholder="mis. 200.000" />
            </Group>
          ) : null}
        </Step>

        <Step n={3} title="Stok yang kamu pegang" note="Jumlah botol saat ini. Biarkan 0 jika belum ada." done={done[2]}>
          <View style={styles.stockCard}>
            <Pressable onPress={() => setInitialStock(q => Math.max(0, q - 1))} disabled={initialStock === 0} accessibilityRole="button" accessibilityLabel="Kurangi stok awal" style={[styles.stepBtn, initialStock === 0 && { opacity: 0.4 }]}>
              <MinusIcon size={20} color={colors.brand} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <TextInput
                value={String(initialStock)}
                onChangeText={t => setInitialStock(parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)}
                keyboardType="number-pad"
                selectTextOnFocus
                accessibilityLabel="Stok awal (botol)"
                style={styles.stockInput}
                maxLength={4}
              />
              <AppText variant="small" color={colors.textMuted}>botol</AppText>
            </View>
            <Pressable onPress={() => setInitialStock(q => q + 1)} accessibilityRole="button" accessibilityLabel="Tambah stok awal" style={styles.stepBtn}>
              <PlusIcon size={20} color={colors.brand} />
            </Pressable>
          </View>
        </Step>

        <Pressable onPress={signOut} accessibilityRole="button" style={styles.signOut}>
          <AppText variant="small" color={colors.textMuted}>Bukan akunmu? <AppText variant="small" color={colors.danger} style={{ fontWeight: '700' }}>Keluar akun</AppText></AppText>
        </Pressable>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label="Mulai pakai aplikasi" onPress={submit} loading={busy} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

function Step({ n, title, note, done, children }: { n: number; title: string; note?: string; done: boolean; children: ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={[styles.num, done && { backgroundColor: colors.brand }]}>
          <AppText variant="caption" color={done ? colors.white : colors.brandDark} style={{ letterSpacing: 0, fontWeight: '800', fontSize: 12 }}>{n}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="heading" style={{ fontWeight: '800' }}>{title}</AppText>
          {note ? <AppText variant="small" color={colors.textMuted}>{note}</AppText> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: space.lg, paddingBottom: space.xxl },
  hero: { backgroundColor: colors.brand, borderRadius: radius.xl, padding: 18, gap: 6, overflow: 'hidden' },
  progress: { flexDirection: 'row', gap: 6, marginTop: 8 },
  progressPart: { flex: 1, height: 5, borderRadius: 3 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  stockCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 18, padding: 14 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  stockInput: { fontSize: 32, fontWeight: '800', color: colors.text, textAlign: 'center', minWidth: 80, paddingVertical: 0 },
  signOut: { alignSelf: 'center', minHeight: 40, justifyContent: 'center' },
});
