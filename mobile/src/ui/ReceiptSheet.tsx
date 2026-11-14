import { useEffect } from 'react';
import { BackHandler, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDate, formatTime } from '~/lib/dates';
import { formatRupiah } from '~/lib/money';
import { buildReceiptText, paymentLines, receiptNumber, whatsappUrl, type ReceiptInput } from '~/lib/receipt';
import { AppText } from './components';
import { ChatIcon, CheckIcon, CloseIcon, ShareIcon } from './icons';
import { StickyFooter } from './sheet';
import { colors, radius, space } from './theme';

/**
 * Nota pesanan, drawn over the order screen. In "created" mode it is the success screen right after
 * saving; in "view" mode it opens from the Nota tile. The card shows exactly the text that is sent.
 */
export function ReceiptSheet({ mode, receipt, phone, onClose }: { mode: 'created' | 'view'; receipt: ReceiptInput; phone?: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const text = buildReceiptText(receipt);
  const bottles = receipt.bottles;
  const hasPhone = (phone ?? '').replace(/\D/g, '').length >= 9;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => sub.remove();
  }, [onClose]);

  const sendWhatsApp = () => { Linking.openURL(whatsappUrl(text, phone)).catch(() => Share.share({ message: text })); };
  const shareOther = () => { Share.share({ message: text }); };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        {mode === 'view' ? <AppText variant="title" style={{ flex: 1, fontSize: 20 }}>Nota pesanan</AppText> : <View style={{ flex: 1 }} />}
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Tutup nota" hitSlop={12} style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}>
          <CloseIcon color="#3A3A3C" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {mode === 'created' ? (
          <View style={styles.success} accessibilityLiveRegion="polite">
            <View style={styles.check}><CheckIcon size={30} color={colors.white} /></View>
            <AppText variant="title" style={{ fontSize: 22, textAlign: 'center' }}>Order berhasil dibuat</AppText>
            <AppText variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
              {receipt.customerName} · {bottles} botol · {formatRupiah(receipt.total)}
            </AppText>
            <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center' }}>Kirim notanya ke pelanggan sekarang?</AppText>
          </View>
        ) : null}

        <ReceiptCard receipt={receipt} />

        {paymentLines(receipt.payments).length === 0 ? (
          <Pressable onPress={() => { onClose(); router.push('/toko'); }} accessibilityRole="button" style={styles.tip}>
            <AppText variant="small" color={colors.textMuted} style={{ flex: 1 }}>
              Nota belum memuat cara bayar. <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }}>Isi rekening di Toko online</AppText> supaya pelanggan tahu harus transfer ke mana.
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
      <StickyFooter>
        <Pressable onPress={sendWhatsApp} accessibilityRole="button" accessibilityLabel={hasPhone ? `Kirim nota ke WhatsApp ${receipt.customerName}` : 'Kirim nota ke WhatsApp'} style={({ pressed }) => [styles.wa, pressed && { opacity: 0.85 }]}>
          <ChatIcon size={22} color={colors.white} />
          <AppText variant="bodyStrong" color={colors.white} style={{ fontSize: 16, fontWeight: '800' }}>{hasPhone ? `Kirim ke WhatsApp ${firstName(receipt.customerName)}` : 'Kirim lewat WhatsApp'}</AppText>
        </Pressable>
        <View style={styles.row2}>
          <Pressable onPress={shareOther} accessibilityRole="button" style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }]}>
            <ShareIcon size={18} color={colors.text} />
            <AppText variant="bodyStrong" style={{ fontWeight: '700' }}>Bagikan lainnya</AppText>
          </Pressable>
          {mode === 'created' ? (
            <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }]}>
              <AppText variant="bodyStrong" style={{ fontWeight: '700' }}>Lihat detail order</AppText>
            </Pressable>
          ) : null}
        </View>
      </StickyFooter>
    </View>
  );
}

const firstName = (name: string) => name.trim().split(/\s+/).slice(0, 2).join(' ');

/** Paper-style nota: the same content as the WhatsApp text, laid out for the screen. */
export function ReceiptCard({ receipt }: { receipt: ReceiptInput }) {
  const bottles = receipt.bottles;
  const pay = paymentLines(receipt.payments);
  return (
    <View style={styles.paper} accessibilityLabel={`Nota ${receiptNumber(receipt.orderId)} untuk ${receipt.customerName}, total ${formatRupiah(receipt.total)}`}>
      <View style={styles.paperTop} />
      <View style={{ gap: 2 }}>
        <AppText variant="caption" color={colors.brand} style={{ letterSpacing: 1.2, fontWeight: '800' }}>NOTA PESANAN</AppText>
        <AppText variant="heading" style={{ fontSize: 18, fontWeight: '800' }}>{receipt.storeName.trim() || 'Rekapan Mitra'}</AppText>
      </View>
      <View style={{ gap: 4 }}>
        <Meta label="No." value={receiptNumber(receipt.orderId)} />
        <Meta label="Tanggal" value={`${formatDate(receipt.createdAt)}, ${formatTime(receipt.createdAt)}`} />
        <Meta label="Pelanggan" value={receipt.customerName.trim() || '-'} />
      </View>
      <View style={styles.dash} />
      <View style={{ gap: 12 }}>
        {receipt.items.map(i => (
          <View key={i.name} style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="bodyStrong">{i.name}</AppText>
              <AppText variant="small" color={colors.textMuted}>{i.quantity} × {formatRupiah(i.pricePerBottle)}</AppText>
            </View>
            <AppText variant="bodyStrong">{formatRupiah(i.subtotal)}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.dash} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <AppText variant="bodyStrong">Total · {bottles} botol</AppText>
        <AppText variant="title" color={colors.brandDark} style={{ fontSize: 22 }}>{formatRupiah(receipt.total)}</AppText>
      </View>
      {pay.length ? (
        <View style={styles.payBox}>
          <AppText variant="small" color={colors.textMuted} style={{ fontWeight: '700' }}>Pembayaran</AppText>
          {pay.map(line => <AppText key={line} variant="body" selectable>{line}</AppText>)}
        </View>
      ) : null}
      {receipt.storeUrl ? <AppText variant="small" color={colors.textMuted}>Pesan lagi: {receipt.storeUrl}</AppText> : null}
      <AppText variant="small" color={colors.textMuted} style={{ textAlign: 'center', paddingTop: 2 }}>Terima kasih sudah berbelanja 🙏</AppText>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <AppText variant="small" color={colors.textMuted} style={{ width: 74 }}>{label}</AppText>
      <AppText variant="small" style={{ flex: 1, fontWeight: '600' }}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: 8, paddingBottom: 4, minHeight: 52 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg },
  success: { alignItems: 'center', gap: 6, paddingTop: 4 },
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  paper: { backgroundColor: colors.white, borderRadius: 18, padding: 18, paddingTop: 22, gap: 14, overflow: 'hidden' },
  paperTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: colors.brand },
  dash: { borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: '#D1D1D6' },
  payBox: { gap: 4, borderRadius: 12, backgroundColor: colors.bg, padding: 12 },
  tip: { flexDirection: 'row', paddingHorizontal: 4 },
  wa: { minHeight: 52, borderRadius: radius.pill, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  row2: { flexDirection: 'row', gap: space.sm },
  secondary: { flex: 1, minHeight: 46, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
