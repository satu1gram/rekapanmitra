import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { parseChatText } from '~/data/assistant';
import { useCatalog } from '~/hooks/queries';
import { aiDate, draftFromAiItems } from '~/lib/aiDraft';
import { productCategories, productDisplayName } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { AppText, Notice } from '~/ui/components';
import { ChatIcon } from '~/ui/icons';
import type { OrderFormInitial } from '~/ui/OrderForm';
import { CapsuleButton, SheetHeader, StickyFooter } from '~/ui/sheet';
import { colors, space, accents } from '~/ui/theme';

export default function AssistantScreen() {
  const catalog = useCatalog();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'info' | 'warning' | 'danger'; text: string } | null>(null);

  const read = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await parseChatText(text);
      const categories = catalog.data ? productCategories(catalog.data) : [];
      if (result.intent === 'out_of_scope') {
        setMessage({ tone: 'warning', text: result.message });
        return;
      }
      const draft = draftFromAiItems(result.items, categories);
      const notices: NonNullable<OrderFormInitial['notices']> = [
        { tone: 'info', text: 'Draf dari Asisten AI. Periksa pelanggan, produk, dan jumlah sebelum menyimpan.' },
      ];
      if (draft.unknown.length) notices.push({ tone: 'warning', text: `Tidak dikenali, tambahkan manual jika perlu: ${draft.unknown.join(', ')}.` });
      if (draft.packageLines.length) notices.push({ tone: 'warning', text: `Periksa jumlah botol untuk: ${draft.packageLines.join(', ')} (ditulis sebagai paket).` });

      if (result.intent === 'restok') {
        const total = Object.values(draft.quantities).reduce((s, q) => s + q, 0);
        if (total === 0) {
          setMessage({ tone: 'warning', text: 'Ini terbaca sebagai restok, tapi jumlah botolnya tidak terbaca. Catat restok secara manual.' });
          return;
        }
        router.replace({ pathname: '/restok/new', params: { qty: String(total) } });
        return;
      }
      if (result.catatan) notices.push({ tone: 'info', text: `Catatan dari chat: ${result.catatan}` });
      const date = aiDate(result.tanggal);
      const initial = {
        customerName: result.pelanggan,
        customerPhone: result.hp,
        quantities: draft.quantities,
        date: date?.toISOString(),
        notices,
      };
      router.replace({ pathname: '/order/new', params: { draft: JSON.stringify(initial) } });
    } catch (e) {
      setMessage({ tone: 'danger', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const names = catalog.data ? productCategories(catalog.data).slice(0, 2).map(productDisplayName) : ['British Propolis', 'BP Green'];
  const examples = [
    `Kak, Bu Rina pesan ${names[0]} 2 sama ${names[1] ?? names[0]} 1 ya, kirim ke Bekasi. 0812 3456 7890`,
    `Restok dari upline 20 botol ${names[0]} hari ini`,
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SheetHeader title="Isi dari chat" onClose={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.steps}>
          {['Tempel', 'Periksa', 'Simpan'].map((step, i) => (
            <View key={step} style={styles.step}>
              <View style={[styles.stepNum, i === 0 && { backgroundColor: colors.brand }]}>
                <AppText variant="caption" color={i === 0 ? colors.white : colors.textMuted} style={{ letterSpacing: 0, fontWeight: '800' }}>{i + 1}</AppText>
              </View>
              <AppText variant="small" color={i === 0 ? colors.text : colors.textMuted} style={{ fontWeight: i === 0 ? '700' : '500' }}>{step}</AppText>
              {i < 2 ? <View style={styles.stepLine} /> : null}
            </View>
          ))}
        </View>

        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

        <View style={styles.card}>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Tempel chat pesanan atau restok di sini…"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            maxLength={2000}
            accessibilityLabel="Isi chat"
          />
          <View style={styles.cardFoot}>
            <AppText variant="caption" color={colors.textMuted} style={{ flex: 1, letterSpacing: 0, fontWeight: '500' }}>{text.length}/2000</AppText>
            {text ? (
              <Pressable onPress={() => setText('')} hitSlop={8} accessibilityRole="button">
                <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Kosongkan</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>

        {!text ? (
          <View style={{ gap: 8 }}>
            <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>Coba contoh</AppText>
            {examples.map(ex => (
              <Pressable key={ex} onPress={() => setText(ex)} accessibilityRole="button" style={({ pressed }) => [styles.example, pressed && { opacity: 0.7 }]}>
                <ChatIcon size={18} color={accents.violet.fg} />
                <AppText variant="small" style={{ flex: 1 }} numberOfLines={2}>{ex}</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        <AppText variant="small" color={colors.textMuted} style={{ lineHeight: 19 }}>
          Asisten hanya mengisi draf. Harga, modal, dan untung tetap dihitung aplikasi. Teks dikirim ke layanan AI untuk dibaca, jadi hapus data yang tidak perlu.
        </AppText>
      </ScrollView>

      <StickyFooter>
        <CapsuleButton label={busy ? 'Membaca chat…' : 'Baca chat'} onPress={read} loading={busy} disabled={!text.trim()} />
        <Pressable onPress={() => router.replace('/order/new')} accessibilityRole="button" style={styles.manual}>
          <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Isi order manual saja</AppText>
        </Pressable>
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  steps: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginRight: 4 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 14, gap: 8 },
  input: { minHeight: 170, fontSize: 15, lineHeight: 21, color: colors.text, textAlignVertical: 'top', padding: 0 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: 8 },
  example: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.white },
  manual: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
});
