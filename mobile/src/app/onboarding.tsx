import { useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MITRA_LEVELS, type MitraLevel } from '@/types';

import { completeOnboarding } from '~/data/profile';
import { useCatalog, useProfile } from '~/hooks/queries';
import { formatNumberInput, formatRupiah, parseRupiahInput } from '~/lib/money';
import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { HeroDecor, ON_BRAND_MUTED } from '~/ui/brand';
import { AppText, Notice } from '~/ui/components';
import { ChatIcon, CheckIcon, ChevronIcon, MinusIcon, PlusIcon, StoreIcon, type IconProps } from '~/ui/icons';
import { FieldRow, Group, kitStyles } from '~/ui/kit';
import { productImage } from '~/ui/productMedia';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { StageSteps } from '~/ui/StageSteps';
import { accents, colors, space, type Accent } from '~/ui/theme';
import { KeyboardSafeView } from '~/ui/KeyboardSafeView';

const STEPS = ['Profil', 'Level', 'Stok'];
const LEVELS: { level: MitraLevel; min: string }[] = [
  { level: 'reseller', min: '3' },
  { level: 'agen', min: '5' },
  { level: 'agen_plus', min: '10' },
  { level: 'sap', min: '40' },
  { level: 'se', min: '200' },
];
const QUICK_STOCK = [0, 5, 10, 20];

/**
 * First-time setup, one topic per screen (Profil → Level → Stok), then a "ready" screen that
 * points to the first useful action. The profile is only refreshed when the person leaves the
 * ready screen, so it is not swapped out for Beranda the moment the data is saved.
 */
export default function OnboardingScreen() {
  const { signOut } = useAuth();
  const profile = useProfile();
  const catalog = useCatalog();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.data?.name ?? '');
  const [phone, setPhone] = useState(profile.data?.phone ?? '');
  const [level, setLevel] = useState<MitraLevel>(profile.data?.mitra_level ?? 'agen');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [stock, setStock] = useState(0);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = level === 'custom' ? customPrice ?? 0 : MITRA_LEVELS[level].buyPricePerBottle;
  const levelName = level === 'custom' ? customName.trim() || 'Level kustom' : MITRA_LEVELS[level].label;
  // Example sale uses the catalog's single-bottle price of British Propolis.
  const bpPrice = Number(catalog.data?.find(p => p.category === 'BP' && p.package_type === 'satuan')?.price ?? 265000);
  const canNext = step === 0 ? !!name.trim() : step === 1 ? level !== 'custom' || (!!customName.trim() && !!customPrice) : true;
  const firstName = name.trim().split(' ')[0];

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding({ name, phone, mitraLevel: level, customLevelName: customName, customBuyPrice: customPrice, initialStock: stock });
      setStep(3);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setError(null);
    if (step < 2) setStep(step + 1);
    else save();
  };

  /** Load the finished profile (the app then shows the main screens) and optionally open a first action. */
  const finish = async (target?: Href) => {
    setLeaving(true);
    await queryClient.invalidateQueries();
    if (target) setTimeout(() => router.push(target), 50);
  };

  if (step === 3) {
    return (
      <View style={kitStyles.page}>
        <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
          <View style={[styles.doneHero, { paddingTop: insets.top + 40 }]}>
            <HeroDecor />
            <View style={styles.doneCheck}><CheckIcon size={34} color={colors.brand} /></View>
            <AppText variant="title" color={colors.white} style={{ fontSize: 24, lineHeight: 30, textAlign: 'center' }}>Akunmu siap{firstName ? `, ${firstName}` : ''}!</AppText>
            <AppText variant="body" color={ON_BRAND_MUTED} style={{ fontSize: 15, lineHeight: 22, textAlign: 'center' }}>Semua pengaturan bisa diubah kapan saja di menu Akun.</AppText>
          </View>
          <View style={{ marginTop: -36, paddingHorizontal: space.lg, gap: space.lg }}>
            <View style={styles.summary}>
              <SummaryRow first label="Level mitra" value={levelName} />
              <SummaryRow label="Modal per botol" value={formatRupiah(cost)} />
              <SummaryRow label="Stok awal" value={`${stock} botol`} />
            </View>
            <View style={{ gap: space.sm }}>
              <AppText variant="heading" style={{ fontWeight: '800' }}>Mulai dari sini</AppText>
              <View style={styles.group}>
                <FirstAction first label="Catat order pertama" note="Untung langsung terlihat di Beranda" accent="green" filled Icon={PlusIcon} onPress={() => finish('/order/new')} disabled={leaving} />
                <FirstAction label="Coba isi order dari chat" note="Tempel pesan WhatsApp pelanggan" accent="violet" Icon={ChatIcon} onPress={() => finish('/asisten')} disabled={leaving} />
                <FirstAction label="Buka toko online" note="Pelanggan bisa pesan lewat link" accent="teal" Icon={StoreIcon} onPress={() => finish('/toko')} disabled={leaving} />
              </View>
            </View>
          </View>
        </ScrollView>
        <StickyFooter>
          <CapsuleButton label="Ke Beranda" onPress={() => finish()} loading={leaving} />
        </StickyFooter>
      </View>
    );
  }

  return (
    <KeyboardSafeView style={kitStyles.page}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} accessibilityRole="button" accessibilityLabel="Kembali ke langkah sebelumnya" hitSlop={8} style={styles.back}>
              <ChevronIcon direction="left" size={20} color={colors.text} />
            </Pressable>
          ) : null}
          <AppText variant="title" style={{ flex: 1, fontSize: 18 }}>Lengkapi profil</AppText>
        </View>
        <StageSteps labels={STEPS} current={step} />
      </View>

      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]} keyboardShouldPersistTaps="handled">
        {profile.data === null ? <Notice tone="warning">Profil akun belum terbentuk di server. Jika simpan gagal, hubungi admin.</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}

        {step === 0 ? (
          <Section title="Kenalan dulu, yuk" note="Nama tampil di nota yang kamu bagikan ke pelanggan.">
            <View style={styles.preview}>
              <View style={styles.avatar}><AppText variant="title" color={colors.brandDark} style={{ fontSize: 24 }}>{(name.trim()[0] || '?').toUpperCase()}</AppText></View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="heading" style={{ fontSize: 17, fontWeight: '800' }} numberOfLines={1}>{name.trim() || 'Nama kamu'}</AppText>
                <AppText variant="small" color={colors.textMuted}>Mitra British Propolis</AppText>
              </View>
            </View>
            <Group>
              <FieldRow first label="Nama" value={name} onChangeText={setName} autoComplete="name" autoCapitalize="words" placeholder="mis. Salinov Akbar" />
              <FieldRow label="No. WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="Opsional, mis. 0812…" />
            </Group>
            <AppText variant="small" color={colors.textMuted} style={{ paddingHorizontal: 4 }}>Nomor WhatsApp dipakai untuk tombol hubungi di toko online. Bisa diisi nanti.</AppText>
          </Section>
        ) : null}

        {step === 1 ? (
          <Section title="Kamu mitra level apa?" note="Level menentukan harga modal per botol, jadi untung di setiap order akurat.">
            <View style={{ gap: 8 }} accessibilityRole="radiogroup">
              {LEVELS.map(l => (
                <LevelCard
                  key={l.level}
                  selected={level === l.level}
                  badge={`${l.min}+`}
                  title={MITRA_LEVELS[l.level].label}
                  note={`Modal ${formatRupiah(MITRA_LEVELS[l.level].buyPricePerBottle)} per botol · beli min. ${l.min} botol`}
                  onPress={() => setLevel(l.level)}
                />
              ))}
              <LevelCard
                selected={level === 'custom'}
                badge="Atur"
                title={customName.trim() || 'Level kustom'}
                note={customPrice ? `Modal ${formatRupiah(customPrice)} per botol · kamu yang atur` : 'Atur nama level dan modal sendiri'}
                onPress={() => setLevel('custom')}
              />
            </View>
            {level === 'custom' ? (
              <View style={{ gap: 8 }}>
                <AppText variant="heading" style={{ fontWeight: '800' }}>Atur level kustom</AppText>
                <Group>
                  <FieldRow first label="Nama level" value={customName} onChangeText={setCustomName} placeholder="mis. Distributor" />
                  <FieldRow label="Modal/botol" value={formatNumberInput(customPrice)} onChangeText={t => setCustomPrice(parseRupiahInput(t))} keyboardType="number-pad" placeholder="mis. 200.000" suffix={<AppText variant="small" color={colors.textMuted}>Rp</AppText>} />
                </Group>
                <AppText variant="small" color={colors.textMuted} style={{ paddingHorizontal: 4 }}>Pakai ini kalau harga belimu dari upline berbeda dari daftar di atas.</AppText>
              </View>
            ) : null}
            <View style={styles.example} accessibilityLiveRegion="polite">
              <AppText variant="small" color={colors.brandDark} style={{ fontWeight: '700' }}>Contoh dengan level {levelName}</AppText>
              <AppText variant="body" style={{ fontSize: 15, lineHeight: 21 }}>
                Jual 1 British Propolis {formatRupiah(bpPrice)}, modal kamu <AppText variant="bodyStrong">{cost ? formatRupiah(cost) : 'belum diisi'}</AppText>, untung{' '}
                <AppText variant="bodyStrong" color={colors.brand}>{cost ? formatRupiah(bpPrice - cost) : 'terhitung setelah modal diisi'}</AppText>.
              </AppText>
            </View>
          </Section>
        ) : null}

        {step === 2 ? (
          <Section title="Berapa botol yang kamu pegang?" note="Dipakai untuk mengingatkan saat stok menipis. Biarkan 0 jika belum ada.">
            <View style={styles.stockCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable onPress={() => setStock(s => Math.max(0, s - 1))} disabled={stock === 0} accessibilityRole="button" accessibilityLabel="Kurangi stok awal" style={[styles.stepBtn, stock === 0 && { opacity: 0.4 }]}>
                  <MinusIcon size={22} color={colors.brand} />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <TextInput
                    value={String(stock)}
                    onChangeText={t => setStock(parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    maxLength={4}
                    accessibilityLabel="Stok awal (botol)"
                    style={styles.stockInput}
                  />
                  <AppText variant="small" color={colors.textMuted}>botol</AppText>
                </View>
                <Pressable onPress={() => setStock(s => s + 1)} accessibilityRole="button" accessibilityLabel="Tambah stok awal" style={styles.stepBtn}>
                  <PlusIcon size={22} color={colors.brand} />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
                {QUICK_STOCK.map(n => (
                  <Pressable key={n} onPress={() => setStock(n)} accessibilityRole="radio" accessibilityState={{ selected: stock === n }} accessibilityLabel={`${n} botol`} style={[styles.quick, stock === n && styles.quickOn]}>
                    <AppText variant="bodyStrong" color={stock === n ? colors.white : colors.text} style={{ fontWeight: '700' }}>{n}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.note}>
              {productImage('BP') ? <Image source={productImage('BP')!} style={styles.noteImg} accessibilityIgnoresInvertColors /> : null}
              <AppText variant="body" color={colors.label} style={{ flex: 1, lineHeight: 20 }}>Stok bertambah otomatis setiap kamu <AppText variant="bodyStrong">Catat restok</AppText>.</AppText>
            </View>
          </Section>
        ) : null}

        {step === 0 ? (
          <Pressable onPress={signOut} accessibilityRole="button" style={styles.signOut}>
            <AppText variant="small" color={colors.textMuted}>Bukan akunmu? <AppText variant="small" color={colors.danger} style={{ fontWeight: '700' }}>Keluar akun</AppText></AppText>
          </Pressable>
        ) : null}
      </ScrollView>

      <StickyFooter>
        <CapsuleButton
          label={step < 2 ? (canNext ? 'Lanjut' : step === 0 ? 'Isi nama dulu' : 'Isi nama level dan modal') : 'Simpan dan selesai'}
          onPress={next}
          loading={busy}
          disabled={!canNext}
        />
      </StickyFooter>
    </KeyboardSafeView>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 6 }}>
        <AppText variant="title" style={{ fontSize: 24, lineHeight: 30 }}>{title}</AppText>
        <AppText variant="body" color={colors.textMuted} style={{ fontSize: 15, lineHeight: 22 }}>{note}</AppText>
      </View>
      {children}
    </View>
  );
}

function LevelCard({ selected, badge, title, note, onPress }: { selected: boolean; badge: string; title: string; note: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${title}. ${note}`} style={({ pressed }) => [styles.level, selected && styles.levelOn, pressed && { opacity: 0.8 }]}>
      <View style={[styles.levelBadge, selected && { backgroundColor: colors.brand }]}>
        <AppText variant="caption" color={selected ? colors.white : colors.label} style={{ fontSize: 13, fontWeight: '800', letterSpacing: 0 }}>{badge}</AppText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="small" color={colors.textMuted}>{note}</AppText>
      </View>
      <View style={[styles.radio, selected && { borderColor: colors.brand }]}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </Pressable>
  );
}

function SummaryRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <View style={[styles.summaryRow, !first && styles.sep]}>
      <AppText variant="body" color={colors.textMuted}>{label}</AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function FirstAction({ label, note, Icon, accent, filled, first, onPress, disabled }: {
  label: string; note: string; Icon: (p: IconProps) => ReactNode; accent: Accent; filled?: boolean; first?: boolean; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${label}. ${note}`} style={({ pressed }) => [styles.action, !first && styles.sep, pressed && { opacity: 0.7 }]}>
      <View style={[styles.actionIcon, { backgroundColor: filled ? colors.brand : accents[accent].bg }]}>
        <Icon size={20} color={filled ? colors.white : accents[accent].fg} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="small" color={colors.textMuted}>{note}</AppText>
      </View>
      <ChevronIcon direction="right" size={16} color="#8E8E93" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingBottom: 12, gap: 14, backgroundColor: colors.bg },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: 18, padding: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  level: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderWidth: 2, borderColor: colors.white, backgroundColor: colors.white },
  levelOn: { borderColor: colors.brand },
  levelBadge: { width: 44, height: 40, borderRadius: 12, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.brand },
  example: { borderRadius: 18, backgroundColor: colors.brandSoft, padding: 14, gap: 4 },
  stockCard: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 18, gap: 16 },
  stepBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  stockInput: { fontSize: 44, fontWeight: '800', color: colors.text, textAlign: 'center', minWidth: 90, paddingVertical: 0 },
  quick: { flex: 1, minHeight: 40, borderRadius: 20, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  quickOn: { backgroundColor: colors.brand },
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  noteImg: { width: 44, height: 44, borderRadius: 12 },
  signOut: { alignSelf: 'center', minHeight: 40, justifyContent: 'center' },
  doneHero: { backgroundColor: colors.brand, paddingHorizontal: 24, paddingBottom: 72, alignItems: 'center', gap: 12, overflow: 'hidden', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  doneCheck: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 46 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  group: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  actionIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
