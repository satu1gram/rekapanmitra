import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';

import { parseChatText } from '~/data/assistant';
import { useCatalog } from '~/hooks/queries';
import { aiDate, draftFromAiItems } from '~/lib/aiDraft';
import { productCategories, productDisplayName } from '~/lib/orderMath';
import { errorMessage } from '~/lib/supabase';
import { AppText, Button, Card, Notice, Screen, TextField } from '~/ui/components';
import type { OrderFormInitial } from '~/ui/OrderForm';
import { colors } from '~/ui/theme';

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

  const example = catalog.data ? productCategories(catalog.data).slice(0, 2).map(productDisplayName) : ['British Propolis', 'BP Green'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <AppText variant="body" color={colors.textMuted}>
          Tempel chat pesanan dari pelanggan. Asisten mengisi draf order, lalu kamu periksa dan simpan sendiri. Harga dan untung tetap dihitung aplikasi, bukan oleh AI.
        </AppText>
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <Card>
          <TextField
            label="Isi chat"
            value={text}
            onChangeText={setText}
            multiline
            placeholder={`Contoh: Kak, Bu Rina pesan ${example[0]} 2 sama ${example[1] ?? example[0]} 1 ya, kirim ke Bekasi. 0812xxxx`}
            style={{ minHeight: 160, textAlignVertical: 'top', paddingTop: 12 }}
            maxLength={2000}
          />
          <AppText variant="small" color={colors.textSubtle}>{text.length}/2000 · Teks dikirim ke layanan AI untuk dibaca. Hapus data yang tidak perlu.</AppText>
        </Card>
        <Button label="Baca chat" icon="sparkles" onPress={read} loading={busy} disabled={!text.trim()} />
        <Button label="Isi manual saja" tone="ghost" onPress={() => router.replace('/order/new')} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
