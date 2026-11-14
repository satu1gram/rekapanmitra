import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';

import { errorMessage } from '~/lib/supabase';
import { useAuth } from '~/providers/AuthProvider';
import { AppText, Notice } from '~/ui/components';
import { CheckIcon } from '~/ui/icons';
import { kitStyles, PageHeader } from '~/ui/kit';
import { CapsuleButton, StickyFooter } from '~/ui/sheet';
import { StageSteps } from '~/ui/StageSteps';
import { colors, space } from '~/ui/theme';

const COOLDOWN = 45;
const TIPS = ['Tunggu 1 sampai 2 menit, lalu cek lagi.', 'Buka folder Spam atau Promosi.', 'Pastikan ejaan email sudah benar.'];

/** After sign-up when email confirmation is on: where the link went, open the mail app, resend, and what to try. */
export default function VerifyScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { resendConfirmation } = useAuth();
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const resend = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await resendConfirmation(email);
      setMessage({ tone: 'success', text: 'Link baru sudah dikirim.' });
      setWait(COOLDOWN);
    } catch (e) {
      setMessage({ tone: 'danger', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const openMail = () => Linking.openURL(Platform.OS === 'ios' ? 'message://' : 'mailto:').catch(() => setMessage({ tone: 'danger', text: 'Aplikasi email tidak ditemukan. Buka email secara manual.' }));

  return (
    <View style={kitStyles.page}>
      <PageHeader title="Verifikasi email" />
      <ScrollView contentContainerStyle={[kitStyles.content, { paddingBottom: space.xxl }]}>
        <StageSteps labels={['Akun', 'Verifikasi']} current={1} />
        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          <View style={styles.mail}>
            <Svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth={1.9} strokeLinejoin="round">
              <Rect x="3" y="5" width="18" height="14" rx="3" fill={colors.brand} fillOpacity={0.22} />
              <Path d="m4 7 8 6 8-6" strokeLinecap="round" />
            </Svg>
            <View style={styles.badge}><CheckIcon size={12} color={colors.white} /></View>
          </View>
        </View>
        <View style={{ gap: 6 }}>
          <AppText variant="title" style={{ fontSize: 24, lineHeight: 30, textAlign: 'center' }}>Cek email kamu</AppText>
          <AppText variant="body" color={colors.textMuted} style={{ fontSize: 15, lineHeight: 22, textAlign: 'center' }}>Kami kirim link konfirmasi ke alamat ini. Buka link itu, lalu kembali ke aplikasi dan masuk.</AppText>
        </View>
        <View style={styles.emailCard}>
          <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1} selectable>{email || 'email kamu'}</AppText>
          <Pressable onPress={() => router.replace('/register')} accessibilityRole="button" accessibilityLabel="Ubah email" hitSlop={8}>
            <AppText variant="small" color={colors.brand} style={{ fontWeight: '700', fontSize: 14 }}>Ubah</AppText>
          </Pressable>
        </View>
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <View style={styles.tips}>
          <AppText variant="heading" style={{ fontWeight: '800' }}>Email belum masuk?</AppText>
          {TIPS.map((tip, i) => (
            <View key={tip} style={{ flexDirection: 'row', gap: 10 }}>
              <AppText variant="bodyStrong" color={colors.brand} style={{ width: 12 }}>{i + 1}</AppText>
              <AppText variant="body" color={colors.label} style={{ flex: 1 }}>{tip}</AppText>
            </View>
          ))}
        </View>
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="button" style={styles.login}>
          <AppText variant="small" color={colors.textMuted}>Sudah verifikasi? <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Masuk</AppText></AppText>
        </Pressable>
      </ScrollView>
      <StickyFooter>
        <CapsuleButton label="Buka aplikasi email" onPress={openMail} />
        <Pressable onPress={resend} disabled={busy || wait > 0} accessibilityRole="button" accessibilityState={{ disabled: busy || wait > 0, busy }} style={styles.resend}>
          <AppText variant="bodyStrong" color={busy || wait > 0 ? colors.textMuted : colors.brand} style={{ fontWeight: '700' }}>
            {busy ? 'Mengirim…' : wait > 0 ? `Kirim ulang dalam 0:${String(wait).padStart(2, '0')}` : 'Kirim ulang link'}
          </AppText>
        </Pressable>
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  mail: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -4, top: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  emailCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 18, padding: 14 },
  tips: { backgroundColor: colors.white, borderRadius: 18, padding: 14, gap: 10 },
  login: { alignSelf: 'center', minHeight: 40, justifyContent: 'center' },
  resend: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
