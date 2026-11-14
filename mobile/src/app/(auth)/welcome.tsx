import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import appIcon from '../../../assets/images/icon.png';
import photoBlue from '../../../assets/onboarding/onb-blue.webp';
import photoBp from '../../../assets/onboarding/onb-bp.webp';
import photoGreen from '../../../assets/onboarding/onb-green.webp';
import { AppText } from '~/ui/components';
import { CapsuleButton } from '~/ui/sheet';
import { colors, space } from '~/ui/theme';

const SLIDES = [
  { photo: photoBp, alt: 'Botol British Propolis di depan sarang lebah', title: 'Catat order dalam hitungan detik', text: 'Pilih pelanggan dan produk. Total, modal, dan untung langsung terhitung.' },
  { photo: photoBlue, alt: 'British Propolis Blue dengan kemasannya', title: 'Harga ikut jumlah botol', text: 'Harga Reseller sampai SE terpakai otomatis sesuai jumlah botol dan jenjang pelanggan.' },
  { photo: photoGreen, alt: 'Botol British Propolis Green dengan daun', title: 'Stok dan keuangan ikut rapi', text: 'Pengingat stok menipis, biaya tambahan, dan target bulanan dalam satu tempat.' },
];

/** First screen for a signed-out person: three full-bleed product photos with what the app does, then sign up or sign in. */
export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const photoHeight = Math.round(height * 0.62);
  const last = index === SLIDES.length - 1;

  const goTo = (i: number) => {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: photoHeight + 40 }}
        accessibilityRole="adjustable"
        accessibilityLabel={`Slide ${index + 1} dari ${SLIDES.length}`}
      >
        {SLIDES.map(slide => (
          <Image key={slide.title} source={slide.photo} style={{ width, height: photoHeight + 40 }} resizeMode="cover" accessibilityLabel={slide.alt} />
        ))}
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 12 }]} pointerEvents="box-none">
        <View style={styles.brandChip}>
          <Image source={appIcon} style={styles.brandIcon} accessibilityIgnoresInvertColors />
          <AppText variant="bodyStrong" style={{ fontWeight: '800', fontSize: 14 }}>Rekapan Mitra</AppText>
        </View>
        <Pressable onPress={() => router.push('/register')} accessibilityRole="button" style={({ pressed }) => [styles.skip, pressed && { opacity: 0.8 }]}>
          <AppText variant="small" style={{ fontWeight: '700', fontSize: 14 }}>Lewati</AppText>
        </Pressable>
      </View>

      <View style={[styles.sheet, { top: photoHeight, paddingBottom: Math.max(insets.bottom, space.lg) + 4 }]}>
        <View style={styles.dots} accessibilityRole="tablist">
          {SLIDES.map((s, i) => (
            <Pressable
              key={s.title}
              onPress={() => goTo(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === index }}
              accessibilityLabel={`Slide ${i + 1} dari ${SLIDES.length}`}
              hitSlop={10}
              style={[styles.dot, { width: i === index ? 24 : 8, backgroundColor: i === index ? colors.brand : colors.borderStrong }]}
            />
          ))}
        </View>
        <View style={{ gap: 8, flex: 1 }}>
          <AppText variant="title" style={{ fontSize: 24, lineHeight: 30 }} accessibilityLabel={SLIDES[index].title}>{SLIDES[index].title}</AppText>
          <AppText variant="body" color={colors.textMuted} style={{ fontSize: 15, lineHeight: 22 }}>{SLIDES[index].text}</AppText>
        </View>
        <View style={{ gap: 4 }}>
          {last ? <CapsuleButton label="Buat akun" onPress={() => router.push('/register')} /> : <CapsuleButton label="Lanjut" onPress={() => goTo(index + 1)} />}
          <Pressable onPress={() => router.push('/login')} accessibilityRole="button" style={styles.secondary}>
            <AppText variant="bodyStrong" color={colors.brand} style={{ fontWeight: '700' }}>Saya sudah punya akun</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingLeft: 5, paddingRight: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.94)' },
  brandIcon: { width: 30, height: 30, borderRadius: 9 },
  skip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.94)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 22, gap: 14 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
