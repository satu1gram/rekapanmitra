import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatRupiah } from '~/lib/money';
import { productDisplayName } from '~/lib/orderMath';
import { AppText, Icon } from './components';
import { productImage } from './productMedia';
import { CapsuleButton, SheetHeader } from './sheet';
import { colors, radius, space } from './theme';

export interface PickerLine {
  productName: string;
  quantity: number;
  pricePerBottle: number;
}

/** Photo grid of catalog products. "+" adds a bottle; a selected card shows a − n + capsule over the photo. */
export function ProductPicker({ visible, lines, onChange, onClose, totalLabel }: {
  visible: boolean;
  lines: PickerLine[];
  onChange: (name: string, quantity: number) => void;
  onClose: () => void;
  totalLabel: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <SheetHeader title="Pilih produk" onClose={onClose} />
        <ScrollView contentContainerStyle={styles.grid}>
          {lines.map(line => <ProductCard key={line.productName} line={line} onChange={q => onChange(line.productName, q)} />)}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) + 4 }]}>
          <CapsuleButton label="Selesai" value={totalLabel} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function ProductCard({ line, onChange }: { line: PickerLine; onChange: (q: number) => void }) {
  const name = productDisplayName(line.productName);
  const image = productImage(line.productName);
  const selected = line.quantity > 0;
  return (
    <View style={styles.card}>
      <View style={[styles.photo, selected && styles.photoSelected]}>
        {image ? <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors /> : (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <AppText variant="title" color={colors.textMuted}>{name.slice(0, 2).toUpperCase()}</AppText>
          </View>
        )}
        {selected ? (
          <View style={styles.qty}>
            <Pressable onPress={() => onChange(line.quantity - 1)} accessibilityRole="button" accessibilityLabel={`Kurangi ${name}`} style={styles.qtyBtn}>
              <Icon name="remove" size={22} color={colors.white} />
            </Pressable>
            <AppText variant="heading" color={colors.white} accessibilityLabel={`${line.quantity} botol ${name}`}>{line.quantity}</AppText>
            <Pressable onPress={() => onChange(line.quantity + 1)} accessibilityRole="button" accessibilityLabel={`Tambah ${name}`} style={styles.qtyBtn}>
              <Icon name="add" size={22} color={colors.white} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => onChange(1)} accessibilityRole="button" accessibilityLabel={`Tambah ${name}`} style={styles.add}>
            <Icon name="add" size={24} color={colors.brand} />
          </Pressable>
        )}
      </View>
      <View style={{ gap: 2, paddingHorizontal: 2 }}>
        <AppText variant="bodyStrong" style={{ fontSize: 15 }} numberOfLines={1}>{name}</AppText>
        <AppText variant="small" color={selected ? colors.brand : colors.textMuted} style={{ fontSize: 13 }}>
          {selected ? `${line.quantity} × ${formatRupiah(line.pricePerBottle)}` : `${formatRupiah(line.pricePerBottle)} / botol`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxxl, columnGap: space.md, rowGap: space.xl },
  card: { width: '47.5%', gap: space.sm },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#E5E5EA' },
  photoSelected: { borderWidth: 3, borderColor: colors.brand },
  add: { position: 'absolute', right: 8, bottom: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  qty: { position: 'absolute', left: 6, right: 6, bottom: 6, height: 44, borderRadius: radius.pill, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
});
